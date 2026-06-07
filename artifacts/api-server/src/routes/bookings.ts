import { Router } from "express";
import { db, bookingsTable, customersTable } from "@workspace/db";
import { eq, desc, sql } from "drizzle-orm";
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
import he from "he";
import { requireAdmin } from "../middleware/admin-auth";
import { sendSms } from "../lib/sms";
import { logger } from "../lib/logger";
import { BUSINESS_PHONE, BUSINESS_EMAIL, ADMIN_BASE_URL, SITE_BASE_URL } from "../lib/constants";
import { parseAuDateTime, buildSingleEventIcs } from "../lib/ical";

const router = Router();

function formatBooking(b: typeof bookingsTable.$inferSelect) {
  return {
    ...b,
    createdAt: b.createdAt.toISOString(),
  };
}

function csvCell(value: string | number | null | undefined): string {
  const str = String(value ?? "");
  return `"${str.replace(/"/g, '""')}"`;
}

function createTransporter() {
  return nodemailer.createTransport({
    host: (process.env["SMTP_HOST"] || "smtp.gmail.com").trim(),
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
  referenceNumber?: string | null;
}) {
  try {
    const transporter = createTransporter();
    const from = `"Electrical Installers" <${process.env["SMTP_USER"] || BUSINESS_EMAIL}>`;
    const ref = booking.referenceNumber ?? "";
    const trackUrl = `${SITE_BASE_URL}/track`;

    const refLineText = ref ? `\nYour reference number: ${ref}` : "";
    const summaryText = [
      "",
      "Your request:",
      `  Job:    ${booking.jobType}`,
      `  Suburb: ${booking.suburb}`,
      `  Date:   ${booking.preferredDate}`,
    ].join("\n");

    await transporter.sendMail({
      from,
      to: booking.customerEmail,
      subject: ref
        ? `We've received your booking (${ref}) — Electrical Installers`
        : "Thank you for contacting Electrical Installers",
      text: `Hi ${booking.customerName},\n\nThank you for contacting Electrical Installers. We've received your booking request and will contact you within one business day to confirm your appointment.${refLineText}\n${summaryText}\n\nTrack your booking status any time: ${trackUrl}\n\nIf you have any urgent questions, please call us on ${BUSINESS_PHONE}.\n\nKind regards,\nElectrical Installers\nMornington Peninsula & Surrounding Areas`,
      html: `<p>Hi ${he.escape(booking.customerName)},</p><p>Thank you for contacting <strong>Electrical Installers</strong>. We've received your booking request and will contact you within one business day to confirm your appointment.</p>${ref ? `<p style="font-size:15px;">Your reference number: <strong>${he.escape(ref)}</strong></p>` : ""}<table style="border-collapse:collapse;font-family:sans-serif;font-size:14px;margin:8px 0;"><tr><td style="padding:4px 12px 4px 0;color:#64748b;">Job</td><td style="padding:4px 0;"><strong>${he.escape(booking.jobType)}</strong></td></tr><tr><td style="padding:4px 12px 4px 0;color:#64748b;">Suburb</td><td style="padding:4px 0;"><strong>${he.escape(booking.suburb)}</strong></td></tr><tr><td style="padding:4px 12px 4px 0;color:#64748b;">Date</td><td style="padding:4px 0;"><strong>${he.escape(booking.preferredDate)}</strong></td></tr></table><p><a href="${trackUrl}" style="background:#f97316;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;font-weight:bold;">Track your booking</a></p><p>If you have any urgent questions, please call us on <strong>${BUSINESS_PHONE}</strong>.</p><p>Kind regards,<br><strong>Electrical Installers</strong><br>Mornington Peninsula &amp; Surrounding Areas</p>`,
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
        `View in admin: ${ADMIN_BASE_URL}/bookings`,
      ].join("\n"),
      html: `
        <h2 style="color:#1a3a5c;">New Booking Request</h2>
        <table style="border-collapse:collapse;width:100%;max-width:560px;font-family:sans-serif;font-size:14px;">
          <tr><td style="padding:6px 12px;font-weight:bold;background:#f5f5f5;width:140px;">Name</td><td style="padding:6px 12px;">${he.escape(booking.customerName)}</td></tr>
          <tr><td style="padding:6px 12px;font-weight:bold;background:#f5f5f5;">Email</td><td style="padding:6px 12px;"><a href="mailto:${he.escape(booking.customerEmail)}">${he.escape(booking.customerEmail)}</a></td></tr>
          <tr><td style="padding:6px 12px;font-weight:bold;background:#f5f5f5;">Phone</td><td style="padding:6px 12px;">${booking.customerPhone ? `<a href="tel:${he.escape(booking.customerPhone)}">${he.escape(booking.customerPhone)}</a>` : "Not provided"}</td></tr>
          <tr><td style="padding:6px 12px;font-weight:bold;background:#f5f5f5;">Service Type</td><td style="padding:6px 12px;">${he.escape(booking.serviceType)}</td></tr>
          <tr><td style="padding:6px 12px;font-weight:bold;background:#f5f5f5;">Job Type</td><td style="padding:6px 12px;">${he.escape(booking.jobType)}</td></tr>
          <tr><td style="padding:6px 12px;font-weight:bold;background:#f5f5f5;">Suburb</td><td style="padding:6px 12px;">${he.escape(booking.suburb)}</td></tr>
          <tr><td style="padding:6px 12px;font-weight:bold;background:#f5f5f5;">Preferred Date</td><td style="padding:6px 12px;">${he.escape(booking.preferredDate)}</td></tr>
          <tr><td style="padding:6px 12px;font-weight:bold;background:#f5f5f5;">Message</td><td style="padding:6px 12px;">${booking.message ? he.escape(booking.message) : "<em>None</em>"}</td></tr>
        </table>
        <p style="margin-top:16px;"><a href="${ADMIN_BASE_URL}/bookings" style="background:#f97316;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;font-weight:bold;">View in Admin</a></p>
      `,
    });
  } catch (err) {
    logger.error({ err }, "Failed to send booking email notification");
  }
}

async function upsertCustomer(booking: typeof bookingsTable.$inferSelect) {
  try {
    await db
      .insert(customersTable)
      .values({
        email: booking.customerEmail,
        name: booking.customerName,
        phone: booking.customerPhone ?? null,
        suburb: booking.suburb,
        jobCount: 1,
        lastJobDate: new Date().toISOString().split("T")[0],
        lastServiceType: booking.serviceType,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: customersTable.email,
        set: {
          name: booking.customerName,
          phone: booking.customerPhone ?? null,
          suburb: booking.suburb,
          jobCount: sql`${customersTable.jobCount} + 1`,
          lastJobDate: new Date().toISOString().split("T")[0],
          lastServiceType: booking.serviceType,
          updatedAt: new Date(),
        },
      });
  } catch (err) {
    logger.error({ err, customerEmail: booking.customerEmail }, "Failed to upsert customer record");
  }
}

const STATUS_LABELS: Record<string, string> = {
  pending: "Received",
  confirmed: "Confirmed",
  scheduled: "Scheduled",
  completed: "Completed",
  cancelled: "Cancelled",
};

const STATUS_MESSAGES: Record<string, string> = {
  pending: "We've received your booking and will be in touch within one business day to confirm.",
  confirmed: "Your booking has been confirmed. We'll be in touch to arrange a time if we haven't already.",
  scheduled: "Your job has been scheduled. We'll see you at the agreed time.",
  completed: "Your job is complete — thank you for choosing Electrical Installers!",
  cancelled: "This booking has been cancelled. Please call us if you'd like to rebook.",
};

async function sendStatusUpdateEmail(booking: typeof bookingsTable.$inferSelect) {
  try {
    const label = STATUS_LABELS[booking.status] ?? booking.status;
    const message = STATUS_MESSAGES[booking.status] ?? "";
    const ref = booking.referenceNumber ?? `#${booking.id}`;
    const trackUrl = `${SITE_BASE_URL}/track`;
    const transporter = createTransporter();
    const from = `"Electrical Installers" <${process.env["SMTP_USER"] || BUSINESS_EMAIL}>`;

    await transporter.sendMail({
      from,
      to: booking.customerEmail,
      subject: `Booking ${ref} update: ${label} — Electrical Installers`,
      text: `Hi ${booking.customerName},\n\nThere's an update on your booking (${ref}).\n\nStatus: ${label}\n${message}\n\nJob:    ${booking.jobType}\nSuburb: ${booking.suburb}\n\nTrack your booking: ${trackUrl}\n\nQuestions? Call us on ${BUSINESS_PHONE}.\n\nKind regards,\nElectrical Installers`,
      html: `<p>Hi ${he.escape(booking.customerName)},</p><p>There's an update on your booking (<strong>${he.escape(ref)}</strong>).</p><p style="font-size:16px;">Status: <strong>${he.escape(label)}</strong></p><p>${he.escape(message)}</p><table style="border-collapse:collapse;font-family:sans-serif;font-size:14px;margin:8px 0;"><tr><td style="padding:4px 12px 4px 0;color:#64748b;">Job</td><td style="padding:4px 0;"><strong>${he.escape(booking.jobType)}</strong></td></tr><tr><td style="padding:4px 12px 4px 0;color:#64748b;">Suburb</td><td style="padding:4px 0;"><strong>${he.escape(booking.suburb)}</strong></td></tr></table><p><a href="${trackUrl}" style="background:#f97316;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;font-weight:bold;">Track your booking</a></p><p>Questions? Call us on <strong>${BUSINESS_PHONE}</strong>.</p><p>Kind regards,<br><strong>Electrical Installers</strong></p>`,
    });
  } catch (err) {
    logger.error({ err }, "Failed to send booking status update email");
  }
}

router.get("/track", async (req, res, next) => {
  const ref = (req.query["ref"] as string | undefined)?.trim();
  const id = Number(req.query["id"]);
  const email = (req.query["email"] as string | undefined)?.trim().toLowerCase();

  if (!email || (!ref && (!id || isNaN(id)))) {
    res.status(400).json({ error: "A reference number (or booking ID) and email are required" });
    return;
  }

  try {
    const [row] = await db
      .select()
      .from(bookingsTable)
      .where(ref ? eq(bookingsTable.referenceNumber, ref) : eq(bookingsTable.id, id));

    if (!row || row.customerEmail.toLowerCase() !== email) {
      res.status(404).json({ error: "Booking not found. Please check your reference number and email address." });
      return;
    }

    res.json({
      id: row.id,
      referenceNumber: row.referenceNumber,
      customerName: row.customerName,
      jobType: row.jobType,
      suburb: row.suburb,
      serviceType: row.serviceType,
      status: row.status,
      preferredDate: row.preferredDate,
      createdAt: row.createdAt.toISOString(),
    });
  } catch (err) {
    next(err);
  }
});

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

router.get("/export", requireAdmin, async (req, res, next) => {
  try {
    const rows = await db
      .select()
      .from(bookingsTable)
      .orderBy(desc(bookingsTable.createdAt));

    const header = "ID,Name,Email,Phone,Service,Job Type,Suburb,Preferred Date,Status,Created\n";
    const lines = rows.map((r) =>
      [
        r.id,
        csvCell(r.customerName),
        csvCell(r.customerEmail),
        csvCell(r.customerPhone),
        csvCell(r.serviceType),
        csvCell(r.jobType),
        csvCell(r.suburb),
        csvCell(r.preferredDate),
        r.status,
        r.createdAt.toISOString(),
      ].join(",")
    );

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", 'attachment; filename="bookings.csv"');
    res.send(header + lines.join("\n"));
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
    const [inserted] = await db
      .insert(bookingsTable)
      .values({ ...parsed.data, status: "pending" })
      .returning();

    const referenceNumber = `EI-${inserted.createdAt.getFullYear()}-${String(inserted.id).padStart(4, "0")}`;
    const [row] = await db
      .update(bookingsTable)
      .set({ referenceNumber })
      .where(eq(bookingsTable.id, inserted.id))
      .returning();

    void sendBookingEmails({ ...parsed.data, referenceNumber });

    void sendSms(
      parsed.data.customerPhone,
      `Hi ${parsed.data.customerName}, your booking request with Electrical Installers has been received. Ref: ${referenceNumber}. We'll be in touch within one business day to confirm. Track it: ${SITE_BASE_URL}/track — or call ${BUSINESS_PHONE}`
    );

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

      const eventStart = parseAuDateTime(confirmedDate);
      const icsAttachment = eventStart
        ? [
            {
              filename: "appointment.ics",
              content: buildSingleEventIcs({
                uid: `booking-${row.id}@electricalinstallers.com.au`,
                start: eventStart,
                summary: `Electrical Installers — ${row.jobType}`,
                description: `Your confirmed appointment with Electrical Installers.${adminNote ? `\n\n${adminNote}` : ""}\n\nPh ${BUSINESS_PHONE}.`,
                location: row.suburb,
              }),
              contentType: "text/calendar; charset=utf-8; method=PUBLISH",
            },
          ]
        : undefined;

      await transporter.sendMail({
        from,
        to: row.customerEmail,
        subject: "Your booking is confirmed — Electrical Installers",
        ...(icsAttachment ? { attachments: icsAttachment, icalEvent: { method: "PUBLISH", content: icsAttachment[0]!.content } } : {}),
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
          `If you need to make any changes, please call us on ${BUSINESS_PHONE}.`,
          "",
          "Kind regards,",
          "Electrical Installers",
          "Mornington Peninsula & Surrounding Areas",
        ].join("\n"),
        html: `
          <p>Hi ${he.escape(row.customerName)},</p>
          <p>Great news! Your booking has been confirmed for:</p>
          <table style="border-collapse:collapse;width:100%;max-width:480px;font-family:sans-serif;font-size:14px;margin:12px 0;">
            <tr><td style="padding:6px 12px;font-weight:bold;background:#f5f5f5;width:120px;">Date / Time</td><td style="padding:6px 12px;">${he.escape(confirmedDate)}</td></tr>
            <tr><td style="padding:6px 12px;font-weight:bold;background:#f5f5f5;">Job</td><td style="padding:6px 12px;">${he.escape(row.jobType)}</td></tr>
            <tr><td style="padding:6px 12px;font-weight:bold;background:#f5f5f5;">Suburb</td><td style="padding:6px 12px;">${he.escape(row.suburb)}</td></tr>
          </table>
          ${adminNote ? `<p style="background:#fff8f0;border-left:4px solid #f97316;padding:10px 14px;border-radius:4px;margin:12px 0;">${he.escape(adminNote).replace(/\n/g, "<br>")}</p>` : ""}
          <p>If you need to make any changes, please call us on <strong>${BUSINESS_PHONE}</strong>.</p>
          <p>Kind regards,<br><strong>Electrical Installers</strong><br>Mornington Peninsula &amp; Surrounding Areas</p>
        `,
      });
    } catch (err) {
      logger.error({ err }, "Failed to send booking confirmation email");
    }

    void sendSms(
      row.customerPhone,
      `Hi ${row.customerName}, your booking with Electrical Installers is confirmed for ${confirmedDate}. Job: ${row.jobType}, ${row.suburb}. Questions? Call ${BUSINESS_PHONE}`
    );

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

    if (bodyParsed.data.status === "completed" || bodyParsed.data.status === "cancelled") {
      void upsertCustomer(row);
    }

    void sendStatusUpdateEmail(row);
    void sendSms(
      row.customerPhone,
      `Hi ${row.customerName}, your Electrical Installers booking ${row.referenceNumber ?? `#${row.id}`} is now: ${STATUS_LABELS[row.status] ?? row.status}. Track it: ${SITE_BASE_URL}/track`
    );

    res.json(formatBooking(row));
  } catch (err) {
    next(err);
  }
});

router.patch("/:id/notes", requireAdmin, async (req, res, next) => {
  const paramParsed = UpdateBookingStatusParams.safeParse({
    id: Number(req.params["id"]),
  });
  if (!paramParsed.success) {
    res.status(400).json({ error: "Invalid ID" });
    return;
  }

  const { adminNotes } = req.body as { adminNotes?: string };

  try {
    const [row] = await db
      .update(bookingsTable)
      .set({ adminNotes: adminNotes ?? null })
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
