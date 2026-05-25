import { Router } from "express";
import { db, customersTable, bookingsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
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
    createdAt: b.createdAt.toISOString(),
  };
}

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
