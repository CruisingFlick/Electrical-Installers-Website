import { Router } from "express";
import { db, quotesTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import {
  CreateQuoteBody,
  UpdateQuoteStatusBody,
  UpdateQuoteStatusParams,
} from "@workspace/api-zod";
import nodemailer from "nodemailer";

const router = Router();

function formatQuote(q: typeof quotesTable.$inferSelect) {
  return {
    ...q,
    createdAt: q.createdAt.toISOString(),
  };
}

async function sendThankYouEmail(to: string, name: string) {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env["SMTP_HOST"] || "smtp.gmail.com",
      port: Number(process.env["SMTP_PORT"] || 587),
      secure: false,
      auth: {
        user: process.env["SMTP_USER"],
        pass: process.env["SMTP_PASS"],
      },
    });

    await transporter.sendMail({
      from: `"Electrical Installers" <${process.env["SMTP_USER"] || "noreply@electricalinstallers.com.au"}>`,
      to,
      subject: "Thank you for contacting Electrical Installers",
      text: `Hi ${name},\n\nThank you for contacting Electrical Installers. We've received your quote request and will be in touch shortly.\n\nKind regards,\nElectrical Installers\nMornington Peninsula | St Kilda | Warragul`,
      html: `<p>Hi ${name},</p><p>Thank you for contacting <strong>Electrical Installers</strong>. We've received your quote request and will be in touch shortly.</p><p>Kind regards,<br><strong>Electrical Installers</strong><br>Mornington Peninsula | St Kilda | Warragul</p>`,
    });
  } catch {
    // Email sending is best-effort; don't fail the request
  }
}

router.get("/", async (req, res) => {
  const rows = await db
    .select()
    .from(quotesTable)
    .orderBy(desc(quotesTable.createdAt));

  res.json(rows.map(formatQuote));
});

router.post("/", async (req, res) => {
  const parsed = CreateQuoteBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [row] = await db
    .insert(quotesTable)
    .values({ ...parsed.data, status: "pending" })
    .returning();

  await sendThankYouEmail(parsed.data.customerEmail, parsed.data.customerName);

  res.status(201).json(formatQuote(row));
});

router.patch("/:id", async (req, res) => {
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
});

export default router;
