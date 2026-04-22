import { Router } from "express";
import { db, bookingsTable } from "@workspace/db";
import { eq, desc, sql } from "drizzle-orm";
import {
  CreateBookingBody,
  UpdateBookingStatusBody,
  GetBookingParams,
  UpdateBookingStatusParams,
  DeleteBookingParams,
  ListBookingsQueryParams,
} from "@workspace/api-zod";
import nodemailer from "nodemailer";

const router = Router();

function formatBooking(b: typeof bookingsTable.$inferSelect) {
  return {
    ...b,
    createdAt: b.createdAt.toISOString(),
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
      text: `Hi ${name},\n\nThank you for contacting Electrical Installers. We've received your request and will be in touch shortly.\n\nIf you have any urgent questions, please call us directly.\n\nKind regards,\nElectrical Installers\nMornington Peninsula | St Kilda | Warragul`,
      html: `<p>Hi ${name},</p><p>Thank you for contacting <strong>Electrical Installers</strong>. We've received your request and will be in touch shortly.</p><p>If you have any urgent questions, please call us directly.</p><p>Kind regards,<br><strong>Electrical Installers</strong><br>Mornington Peninsula | St Kilda | Warragul</p>`,
    });
  } catch {
    // Email sending is best-effort; don't fail the request
  }
}

router.get("/", async (req, res) => {
  const parsed = ListBookingsQueryParams.safeParse(req.query);
  const status = parsed.success ? parsed.data.status : undefined;

  const rows = await db
    .select()
    .from(bookingsTable)
    .where(status ? eq(bookingsTable.status, status) : undefined)
    .orderBy(desc(bookingsTable.createdAt));

  res.json(rows.map(formatBooking));
});

router.post("/", async (req, res) => {
  const parsed = CreateBookingBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [row] = await db
    .insert(bookingsTable)
    .values({ ...parsed.data, status: "pending" })
    .returning();

  await sendThankYouEmail(parsed.data.customerEmail, parsed.data.customerName);

  res.status(201).json(formatBooking(row));
});

router.get("/:id", async (req, res) => {
  const parsed = GetBookingParams.safeParse({ id: Number(req.params["id"]) });
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid ID" });
    return;
  }

  const [row] = await db
    .select()
    .from(bookingsTable)
    .where(eq(bookingsTable.id, parsed.data.id));

  if (!row) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  res.json(formatBooking(row));
});

router.patch("/:id", async (req, res) => {
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
});

router.delete("/:id", async (req, res) => {
  const parsed = DeleteBookingParams.safeParse({ id: Number(req.params["id"]) });
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid ID" });
    return;
  }

  await db.delete(bookingsTable).where(eq(bookingsTable.id, parsed.data.id));
  res.status(204).send();
});

export default router;
