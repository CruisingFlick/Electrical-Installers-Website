import { Router } from "express";
import { db, quotesTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import {
  CreateQuoteBody,
  UpdateQuoteStatusBody,
  UpdateQuoteStatusParams,
} from "@workspace/api-zod";
import he from "he";
import { requireAdmin } from "../middleware/admin-auth";
import { sendSms, sendEmail } from "../lib/clicksend";
import { logger } from "../lib/logger";
import { BUSINESS_PHONE, BUSINESS_EMAIL, ADMIN_BASE_URL, ADMIN_PHONE } from "../lib/constants";

const router = Router();

function formatQuote(q: typeof quotesTable.$inferSelect) {
  return {
    ...q,
    createdAt: q.createdAt.toISOString(),
  };
}

async function sendQuoteEmails(quote: {
  customerName: string;
  customerEmail: string;
  customerPhone?: string | null;
  suburb: string;
  jobType: string;
  description: string;
}) {
  try {
    await sendEmail({
      to: quote.customerEmail,
      subject: "Thank you for your quote request — Electrical Installers",
      text: `Hi ${quote.customerName},\n\nThank you for contacting Electrical Installers. We've received your quote request and will review it and be in touch shortly.\n\nIf you have any urgent questions, please call us on ${BUSINESS_PHONE}.\n\nKind regards,\nElectrical Installers\nMornington Peninsula & Surrounding Areas`,
      html: `<p>Hi ${he.escape(quote.customerName)},</p><p>Thank you for contacting <strong>Electrical Installers</strong>. We've received your quote request and will review it and be in touch shortly.</p><p>If you have any urgent questions, please call us on <strong>${BUSINESS_PHONE}</strong>.</p><p>Kind regards,<br><strong>Electrical Installers</strong><br>Mornington Peninsula &amp; Surrounding Areas</p>`,
    });

    await sendEmail({
      to: BUSINESS_EMAIL,
      subject: `New Quote Request — ${quote.customerName} (${quote.jobType})`,
      text: [
        "NEW QUOTE REQUEST",
        "-----------------",
        `Name:        ${quote.customerName}`,
        `Email:       ${quote.customerEmail}`,
        `Phone:       ${quote.customerPhone || "Not provided"}`,
        `Job Type:    ${quote.jobType}`,
        `Suburb:      ${quote.suburb}`,
        `Description:\n${quote.description}`,
        "",
        `View in admin: ${ADMIN_BASE_URL}/quotes`,
      ].join("\n"),
      html: `
        <h2 style="color:#1a3a5c;">New Quote Request</h2>
        <table style="border-collapse:collapse;width:100%;max-width:560px;font-family:sans-serif;font-size:14px;">
          <tr><td style="padding:6px 12px;font-weight:bold;background:#f5f5f5;width:140px;">Name</td><td style="padding:6px 12px;">${he.escape(quote.customerName)}</td></tr>
          <tr><td style="padding:6px 12px;font-weight:bold;background:#f5f5f5;">Email</td><td style="padding:6px 12px;"><a href="mailto:${he.escape(quote.customerEmail)}">${he.escape(quote.customerEmail)}</a></td></tr>
          <tr><td style="padding:6px 12px;font-weight:bold;background:#f5f5f5;">Phone</td><td style="padding:6px 12px;">${quote.customerPhone ? `<a href="tel:${he.escape(quote.customerPhone)}">${he.escape(quote.customerPhone)}</a>` : "Not provided"}</td></tr>
          <tr><td style="padding:6px 12px;font-weight:bold;background:#f5f5f5;">Job Type</td><td style="padding:6px 12px;">${he.escape(quote.jobType)}</td></tr>
          <tr><td style="padding:6px 12px;font-weight:bold;background:#f5f5f5;">Suburb</td><td style="padding:6px 12px;">${he.escape(quote.suburb)}</td></tr>
          <tr><td style="padding:6px 12px;font-weight:bold;background:#f5f5f5;">Description</td><td style="padding:6px 12px;">${he.escape(quote.description)}</td></tr>
        </table>
        <p style="margin-top:16px;"><a href="${ADMIN_BASE_URL}/quotes" style="background:#f97316;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;font-weight:bold;">View in Admin</a></p>
      `,
    });
  } catch (err) {
    logger.error({ err }, "Failed to send quote email notification");
  }
}

router.get("/", requireAdmin, async (req, res, next) => {
  try {
    const rows = await db
      .select()
      .from(quotesTable)
      .orderBy(desc(quotesTable.createdAt));

    res.json(rows.map(formatQuote));
  } catch (err) {
    next(err);
  }
});

router.post("/", async (req, res, next) => {
  const parsed = CreateQuoteBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  try {
    const [row] = await db
      .insert(quotesTable)
      .values({ ...parsed.data, status: "pending" })
      .returning();

    void sendQuoteEmails(parsed.data);

    void sendSms(
      parsed.data.customerPhone,
      `Hi ${parsed.data.customerName}, your quote request with Electrical Installers has been received. We'll review it and be in touch shortly. Call us: ${BUSINESS_PHONE}`
    );

    void sendSms(
      ADMIN_PHONE,
      `New quote request from ${parsed.data.customerName} (${parsed.data.customerPhone}). View: ${ADMIN_BASE_URL}/quotes`
    );

    res.status(201).json(formatQuote(row));
  } catch (err) {
    next(err);
  }
});

router.patch("/:id", requireAdmin, async (req, res, next) => {
  const paramParsed = UpdateQuoteStatusParams.safeParse({
    id: Number(req.params["id"]),
  });
  if (!paramParsed.success) {
    res.status(400).json({ error: "Invalid ID" });
    return;
  }

  const bodyParsed = UpdateQuoteStatusBody.safeParse(req.body);
  if (!bodyParsed.success) {
    res.status(400).json({ error: bodyParsed.error.message });
    return;
  }

  try {
    const [row] = await db
      .update(quotesTable)
      .set({ status: bodyParsed.data.status })
      .where(eq(quotesTable.id, paramParsed.data.id))
      .returning();

    if (!row) {
      res.status(404).json({ error: "Not found" });
      return;
    }

    res.json(formatQuote(row));
  } catch (err) {
    next(err);
  }
});

export default router;
