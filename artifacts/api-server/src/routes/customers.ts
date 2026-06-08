import { Router } from "express";
import { db, customersTable, bookingsTable } from "@workspace/db";
import { eq, desc, sql, isNull } from "drizzle-orm";
import { z } from "zod";
import { requireAdmin } from "../middleware/admin-auth";

const patchCustomerSchema = z.object({
  marketingNotes: z.string().nullable().optional(),
  tags: z.array(z.string()).nullable().optional(),
});

const router = Router();

function formatCustomer(c: typeof customersTable.$inferSelect) {
  return {
    ...c,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
  };
}

function formatBooking(b: typeof bookingsTable.$inferSelect) {
  return {
    ...b,
    deletedAt: b.deletedAt ? b.deletedAt.toISOString() : null,
    createdAt: b.createdAt.toISOString(),
  };
}

function csvCell(value: string | null | undefined): string {
  const str = String(value ?? "");
  return `"${str.replace(/"/g, '""')}"`;
}

router.post("/sync", requireAdmin, async (req, res, next) => {
  try {
    const bookings = await db
      .select()
      .from(bookingsTable)
      .where(isNull(bookingsTable.deletedAt))
      .orderBy(bookingsTable.createdAt);
    let synced = 0;
    for (const booking of bookings) {
      if (!booking.customerEmail) continue;
      await db
        .insert(customersTable)
        .values({
          email: booking.customerEmail,
          name: booking.customerName,
          phone: booking.customerPhone ?? null,
          suburb: booking.suburb,
          jobCount: 1,
          lastJobDate: booking.createdAt.toISOString().split("T")[0],
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
            lastJobDate: booking.createdAt.toISOString().split("T")[0],
            lastServiceType: booking.serviceType,
            updatedAt: new Date(),
          },
        });
      synced++;
    }
    res.json({ synced });
  } catch (err) {
    next(err);
  }
});

router.get("/export", requireAdmin, async (req, res, next) => {
  try {
    const rows = await db.select().from(customersTable).orderBy(desc(customersTable.updatedAt));
    const header = "Name,Email,Phone,Suburb,Jobs,Last Service,Last Job Date,Tags,Notes,Added\n";
    const lines = rows.map((c) =>
      [
        csvCell(c.name),
        csvCell(c.email),
        csvCell(c.phone),
        csvCell(c.suburb),
        c.jobCount,
        csvCell(c.lastServiceType),
        csvCell(c.lastJobDate),
        csvCell(c.tags?.join(", ")),
        csvCell(c.marketingNotes),
        c.createdAt.toISOString(),
      ].join(",")
    );
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", 'attachment; filename="customers.csv"');
    res.send(header + lines.join("\n"));
  } catch (err) {
    next(err);
  }
});

router.get("/", requireAdmin, async (req, res, next) => {
  try {
    const rows = await db
      .select()
      .from(customersTable)
      .orderBy(desc(customersTable.updatedAt));
    res.json(rows.map(formatCustomer));
  } catch (err) {
    next(err);
  }
});

router.get("/:id", requireAdmin, async (req, res, next) => {
  const id = Number(req.params["id"]);
  if (!id || isNaN(id)) {
    res.status(400).json({ error: "Invalid ID" });
    return;
  }
  try {
    const [customer] = await db
      .select()
      .from(customersTable)
      .where(eq(customersTable.id, id));

    if (!customer) {
      res.status(404).json({ error: "Not found" });
      return;
    }

    const bookings = await db
      .select()
      .from(bookingsTable)
      .where(eq(bookingsTable.customerEmail, customer.email))
      .orderBy(desc(bookingsTable.createdAt));

    res.json({ ...formatCustomer(customer), bookings: bookings.map(formatBooking) });
  } catch (err) {
    next(err);
  }
});

router.patch("/:id", requireAdmin, async (req, res, next) => {
  const id = Number(req.params["id"]);
  if (!id || isNaN(id)) {
    res.status(400).json({ error: "Invalid ID" });
    return;
  }

  const bodyParsed = patchCustomerSchema.safeParse(req.body);
  if (!bodyParsed.success) {
    res.status(400).json({ error: bodyParsed.error.message });
    return;
  }

  const { marketingNotes, tags } = bodyParsed.data;

  try {
    const [row] = await db
      .update(customersTable)
      .set({
        marketingNotes: marketingNotes !== undefined ? marketingNotes : undefined,
        tags: tags !== undefined ? tags : undefined,
        updatedAt: new Date(),
      })
      .where(eq(customersTable.id, id))
      .returning();

    if (!row) {
      res.status(404).json({ error: "Not found" });
      return;
    }

    res.json(formatCustomer(row));
  } catch (err) {
    next(err);
  }
});

export default router;
