import { Router } from "express";
import { db, faqsTable } from "@workspace/db";
import { eq, asc } from "drizzle-orm";
import { z } from "zod";
import { requireAdmin } from "../middleware/admin-auth";
import { logger } from "../lib/logger";

const faqSchema = z.object({
  question: z.string().min(1),
  answer: z.string().min(1),
  sortOrder: z.number().int().optional(),
});

export const publicFaqsRouter = Router();

publicFaqsRouter.get("/", async (_req, res, next) => {
  try {
    const rows = await db
      .select()
      .from(faqsTable)
      .orderBy(asc(faqsTable.sortOrder), asc(faqsTable.id));
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

export const adminFaqsRouter = Router();

adminFaqsRouter.get("/", requireAdmin, async (_req, res, next) => {
  try {
    const rows = await db
      .select()
      .from(faqsTable)
      .orderBy(asc(faqsTable.sortOrder), asc(faqsTable.id));
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

adminFaqsRouter.post("/", requireAdmin, async (req, res, next) => {
  const parsed = faqSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  try {
    const [row] = await db
      .insert(faqsTable)
      .values({ ...parsed.data, sortOrder: parsed.data.sortOrder ?? 0 })
      .returning();
    res.status(201).json(row);
  } catch (err) {
    logger.error({ err }, "Failed to create FAQ");
    next(err);
  }
});

adminFaqsRouter.put("/:id", requireAdmin, async (req, res, next) => {
  const id = Number(req.params["id"]);
  if (!id || isNaN(id)) {
    res.status(400).json({ error: "Invalid ID" });
    return;
  }
  const parsed = faqSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  try {
    const [row] = await db
      .update(faqsTable)
      .set({ ...parsed.data, sortOrder: parsed.data.sortOrder ?? 0 })
      .where(eq(faqsTable.id, id))
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

adminFaqsRouter.delete("/:id", requireAdmin, async (req, res, next) => {
  const id = Number(req.params["id"]);
  if (!id || isNaN(id)) {
    res.status(400).json({ error: "Invalid ID" });
    return;
  }
  try {
    await db.delete(faqsTable).where(eq(faqsTable.id, id));
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});
