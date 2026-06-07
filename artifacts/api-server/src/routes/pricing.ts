import { Router } from "express";
import { db, pricingItemsTable } from "@workspace/db";
import { eq, asc } from "drizzle-orm";
import { z } from "zod";
import { requireAdmin } from "../middleware/admin-auth";
import { logger } from "../lib/logger";

const pricingSchema = z.object({
  label: z.string().min(1),
  priceRange: z.string().min(1),
  description: z.string().optional().nullable(),
  sortOrder: z.number().int().optional(),
});

export const publicPricingRouter = Router();

publicPricingRouter.get("/", async (_req, res, next) => {
  try {
    const rows = await db
      .select()
      .from(pricingItemsTable)
      .orderBy(asc(pricingItemsTable.sortOrder), asc(pricingItemsTable.id));
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

export const adminPricingRouter = Router();

adminPricingRouter.get("/", requireAdmin, async (_req, res, next) => {
  try {
    const rows = await db
      .select()
      .from(pricingItemsTable)
      .orderBy(asc(pricingItemsTable.sortOrder), asc(pricingItemsTable.id));
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

adminPricingRouter.post("/", requireAdmin, async (req, res, next) => {
  const parsed = pricingSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  try {
    const [row] = await db
      .insert(pricingItemsTable)
      .values({
        label: parsed.data.label,
        priceRange: parsed.data.priceRange,
        description: parsed.data.description ?? null,
        sortOrder: parsed.data.sortOrder ?? 0,
      })
      .returning();
    res.status(201).json(row);
  } catch (err) {
    logger.error({ err }, "Failed to create pricing item");
    next(err);
  }
});

adminPricingRouter.put("/:id", requireAdmin, async (req, res, next) => {
  const id = Number(req.params["id"]);
  if (!id || isNaN(id)) {
    res.status(400).json({ error: "Invalid ID" });
    return;
  }
  const parsed = pricingSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  try {
    const [row] = await db
      .update(pricingItemsTable)
      .set({
        label: parsed.data.label,
        priceRange: parsed.data.priceRange,
        description: parsed.data.description ?? null,
        sortOrder: parsed.data.sortOrder ?? 0,
      })
      .where(eq(pricingItemsTable.id, id))
      .returning();
    if (!row) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    res.json(row);
  } catch (err) {
    next(err);
  }
});

adminPricingRouter.delete("/:id", requireAdmin, async (req, res, next) => {
  const id = Number(req.params["id"]);
  if (!id || isNaN(id)) {
    res.status(400).json({ error: "Invalid ID" });
    return;
  }
  try {
    await db.delete(pricingItemsTable).where(eq(pricingItemsTable.id, id));
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});
