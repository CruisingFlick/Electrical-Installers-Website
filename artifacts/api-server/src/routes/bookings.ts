import { Router } from "express";
import { db, bookingsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import {
  CreateBookingBody,
  UpdateBookingStatusBody,
  GetBookingParams,
  UpdateBookingStatusParams,
  DeleteBookingParams,
  ListBookingsQueryParams,
  ConfirmBookingBody,
  ConfirmBookingParams,
} from "@workspace/api-zod";
import nodemailer from "nodemailer";
import { requireAdmin } from "../middleware/admin-auth";

const router = Router();

function esc(value: string | null | undefined): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

function formatBooking(b: typeof bookingsTable.$inferSelect) {
  return {
    ...b,
    createdAt: b.createdAt.toISOString(),
  };
}

const BUSINESS_EMAIL = "info@electricalinstallers.com.au";

function createTransporter() {
  return nodemailer.createTransport({
    host: process.env["SMTP_HOST"] || "smtp.gmail.com",
    port: Number(process.env["SMTP_PORT"] || 587),
    secure: false,
    auth: {
      user: process.env["SMTP_USER"],
      pass: process.env["SMTP_PASS"],
    },
  });
}

async function sendBookingEmails(booking: {
  customerName: string;
  customerEmail: string;
  customerPhone?: string | null;
  serviceType: string;
  jobType: string;
  suburb: string;
  preferredDate: string;
  message?: string | null;
}) {
  try {
    const transporter = createTransporter();
    const from = `"Electrical Installers" <${process.env["SMTP_USER"] || BUSINESS_EMAIL}>`;

    await transporter.sendMail({
      from,
      to: booking.customerEmail,
      subject: "Thank you for contacting Electrical Installers",
      text: `Hi ${booking.customerName},\n\nThank you for contacting Electrical Installers. We've received your booking request and will be in touch within one business day to confirm your appointment.\n\nIf you have any urgent questions, please call us on 0419 868 703.\n\nKind regards,\nElectrical Installers\nMornington Peninsula & Surrounding Areas`,
      html: `<p>Hi ${esc(booking.customerName)},</p><p>Thank you for contacting <strong>Electrical Installers</strong>. We've received your booking request and will be in touch within one business day to confirm your appointment.</p><p>If you have any urgent questions, please call us on <strong>0419 868 703</strong>.</p><p>Kind regards,<br><strong>Electrical Installers</strong><br>Mornington Peninsula &amp; Surrounding Areas</p>`,
    });

    await transporter.sendMail({
      from,
      to: BUSINESS_EMAIL,
      subject: `New Booking Request — ${booking.customerName} (${booking.jobType})`,
      text: [
        "NEW BOOKING REQUEST",
        "-------------------",
        `Name:          ${booking.customerName}`,
        `Email:         ${booking.customerEmail}`,
        `Phone:         ${booking.customerPhone || "Not provided"}`,
        `Service Type:  ${booking.serviceType}`,
        `Job Type:      ${booking.jobType}`,
        `Suburb:        ${booking.suburb}`,
        `Preferred Date:${booking.preferredDate}`,
        `Message:\n${booking.message || "None"}`,
        "",
        "View in admin: https://electricalinstallers.com.au/admin/bookings",
      ].join("\n"),
      html: `
        <h2 style="color:#1a3a5c;">New Booking Request</h2>
        <table style="border-collapse:collapse;width:100%;max-width:560px;font-family:sans-serif;font-size:14px;">
          <tr><td style="padding:6px 12px;font-weight:bold;background:#f5f5f5;width:140px;">Name</td><td style="padding:6px 12px;">${esc(booking.customerName)}</td></tr>
          <tr><td style="padding:6px 12px;font-weight:bold;background:#f5f5f5;">Email</td><td style="padding:6px 12px;"><a href="mailto:${esc(booking.customerEmail)}">${esc(booking.customerEmail)}</a></td></tr>
          <tr><td style="padding:6px 12px;font-weight:bold;background:#f5f5f5;">Phone</td><td style="padding:6px 12px;">${booking.customerPhone ? `<a href="tel:${esc(booking.customerPhone)}">${esc(booking.customerPhone)}</a>` : "Not provided"}</td></tr>
          <tr><td style="padding:6px 12px;font-weight:bold;background:#f5f5f5;">Service Type</td><td style="padding:6px 12px;">${esc(booking.serviceType)}</td></tr>
          <tr><td style="padding:6px 12px;font-weight:bold;background:#f5f5f5;">Job Type</td><td style="padding:6px 12px;">${esc(booking.jobType)}</td></tr>
          <tr><td style="padding:6px 12px;font-weight:bold;background:#f5f5f5;">Suburb</td><td style="padding:6px 12px;">${esc(booking.suburb)}</td></tr>
          <tr><td style="padding:6px 12px;font-weight:bold;background:#f5f5f5;">Preferred Date</td><td style="padding:6px 12px;">${esc(booking.preferredDate)}</td></tr>
          <tr><td style="padding:6px 12px;font-weight:bold;background:#f5f5f5;">Message</td><td style="padding:6px 12px;">${booking.message ? esc(booking.message) : "<em>None</em>"}</td></tr>
        </table>
        <p style="margin-top:16px;"><a href="https://electricalinstallers.com.au/admin/bookings" style="background:#f97316;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;font-weight:bold;">View in Admin</a></p>
      `,
    });
  } catch {
    // Email sending is best-effort; don't fail the request
  }
}

router.get("/", requireAdmin, async (req, res, next) => {
  try {
    const parsed = ListBookingsQueryParams.safeParse(req.query);
    const status = parsed.success ? parsed.data.status : undefined;

    const rows = await db
      .select()
      .from(bookingsTable)
      .where(status ? eq(bookingsTable.status, status) : undefined)
      .orderBy(desc(bookingsTable.createdAt));

    res.json(rows.map(formatBooking));
  } catch (err) {
    next(err);
  }
});

router.post("/", async (req, res, next) => {
  const parsed = CreateBookingBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  try {
    const [row] = await db
      .insert(bookingsTable)
      .values({ ...parsed.data, status: "pending" })
      .returning();

    void sendBookingEmails(parsed.data);

    res.status(201).json(formatBooking(row));
  } catch (err) {
    next(err);
  }
});

router.post("/:id/confirm", requireAdmin, async (req, res, next) => {
  const paramParsed = ConfirmBookingParams.safeParse({
    id: Number(req.params["id"]),
  });
  if (!paramParsed.success) {
    res.status(400).json({ error: "Invalid ID" });
    return;
  }

  const bodyParsed = ConfirmBookingBody.safeParse(req.body);
  if (!bodyParsed.success) {
    res.status(400).json({ error: bodyParsed.error.message });
    return;
  }

  try {
    const [row] = await db
      .update(bookingsTable)
      .set({ status: "confirmed" })
      .where(eq(bookingsTable.id, paramParsed.data.id))
      .returning();

    if (!row) {
      res.status(404).json({ error: "Not found" });
      return;
    }

    const { confirmedDate, adminNote } = bodyParsed.data;

    try {
      const transporter = createTransporter();
      const from = `"Electrical Installers" <${process.env["SMTP_USER"] || BUSINESS_EMAIL}>`;
      const noteSection = adminNote
        ? `\n\nMessage from us:\n${adminNote}`
        : "";

      await transporter.sendMail({
        from,
        to: row.customerEmail,
        subject: "Your booking is confirmed — Electrical Installers",
        text: [
          `Hi ${row.customerName},`,
          "",
          `Great news! Your booking has been confirmed for:`,
          ``,
          `  Date/Time: ${confirmedDate}`,
          `  Job:       ${row.jobType}`,
          `  Suburb:    ${row.suburb}`,
          noteSection,
          "",
          "If you need to make any changes, please call us on 0419 868 703.",
          "",
          "Kind regards,",
          "Electrical Installers",
          "Mornington Peninsula & Surrounding Areas",
        ].join("\n"),
        html: `
          <p>Hi ${esc(row.customerName)},</p>
          <p>Great news! Your booking has been confirmed for:</p>
          <table style="border-collapse:collapse;width:100%;max-width:480px;font-family:sans-serif;font-size:14px;margin:12px 0;">
            <tr><td style="padding:6px 12px;font-weight:bold;background:#f5f5f5;width:120px;">Date / Time</td><td style="padding:6px 12px;">${esc(confirmedDate)}</td></tr>
            <tr><td style="padding:6px 12px;font-weight:bold;background:#f5f5f5;">Job</td><td style="padding:6px 12px;">${esc(row.jobType)}</td></tr>
            <tr><td style="padding:6px 12px;font-weight:bold;background:#f5f5f5;">Suburb</td><td style="padding:6px 12px;">${esc(row.suburb)}</td></tr>
          </table>
          ${adminNote ? `<p style="background:#fff8f0;border-left:4px solid #f97316;padding:10px 14px;border-radius:4px;margin:12px 0;">${esc(adminNote).replace(/\n/g, "<br>")}</p>` : ""}
          <p>If you need to make any changes, please call us on <strong>0419 868 703</strong>.</p>
          <p>Kind regards,<br><strong>Electrical Installers</strong><br>Mornington Peninsula &amp; Surrounding Areas</p>
        `,
      });
    } catch {
      // Email sending is best-effort
    }

    res.json(formatBooking(row));
  } catch (err) {
    next(err);
  }
});

router.get("/:id", requireAdmin, async (req, res, next) => {
  const parsed = GetBookingParams.safeParse({ id: Number(req.params["id"]) });
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid ID" });
    return;
  }

  try {
    const [row] = await db
      .select()
      .from(bookingsTable)
      .where(eq(bookingsTable.id, parsed.data.id));

    if (!row) {
      res.status(404).json({ error: "Not found" });
      return;
    }

    res.json(formatBooking(row));
  } catch (err) {
    next(err);
  }
});

router.patch("/:id", requireAdmin, async (req, res, next) => {
  const paramParsed = UpdateBookingStatusParams.safeParse({
    id: Number(req.params["id"]),
  });
  if (!paramParsed.success) {
    res.status(400).json({ error: "Invalid ID" });
    return;
  }

  const bodyParsed = UpdateBookingStatusBody.safeParse(req.body);
  if (!bodyParsed.success) {
    res.status(400).json({ error: bodyParsed.error.message });
    return;
  }

  try {
    const [row] = await db
      .update(bookingsTable)
      .set({ status: bodyParsed.data.status })
      .where(eq(bookingsTable.id, paramParsed.data.id))
      .returning();

    if (!row) {
      res.status(404).json({ error: "Not found" });
      return;
    }

    res.json(formatBooking(row));
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", requireAdmin, async (req, res, next) => {
  const parsed = DeleteBookingParams.safeParse({ id: Number(req.params["id"]) });
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid ID" });
    return;
  }

  try {
    await db.delete(bookingsTable).where(eq(bookingsTable.id, parsed.data.id));
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;
