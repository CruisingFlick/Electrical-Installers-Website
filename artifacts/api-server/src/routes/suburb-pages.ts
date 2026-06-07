import { Router } from "express";
import { db, suburbPagesTable } from "@workspace/db";
import { eq, asc } from "drizzle-orm";
import { z } from "zod";
import { requireAdmin } from "../middleware/admin-auth";
import { logger } from "../lib/logger";

const suburbPageSchema = z.object({
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/, "Slug must be lowercase letters, numbers, and hyphens only"),
  suburb: z.string().min(1),
  heading: z.string().min(1),
  intro: z.string().min(1),
  portfolioSuburb: z.string().optional().nullable(),
  sortOrder: z.number().int().optional(),
});

function values(data: z.infer<typeof suburbPageSchema>) {
  return {
    slug: data.slug,
    suburb: data.suburb,
    heading: data.heading,
    intro: data.intro,
    portfolioSuburb: data.portfolioSuburb ?? null,
    sortOrder: data.sortOrder ?? 0,
  };
}

export const publicSuburbPagesRouter = Router();

publicSuburbPagesRouter.get("/", async (_req, res, next) => {
  try {
    const rows = await db
      .select()
      .from(suburbPagesTable)
      .orderBy(asc(suburbPagesTable.sortOrder), asc(suburbPagesTable.id));
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

publicSuburbPagesRouter.get("/:slug", async (req, res, next) => {
  try {
    const [row] = await db
      .select()
      .from(suburbPagesTable)
      .where(eq(suburbPagesTable.slug, req.params["slug"]));
    if (!row) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    res.json(row);
  } catch (err) {
    next(err);
  }
});

export const adminSuburbPagesRouter = Router();

adminSuburbPagesRouter.get("/", requireAdmin, async (_req, res, next) => {
  try {
    const rows = await db
      .select()
      .from(suburbPagesTable)
      .orderBy(asc(suburbPagesTable.sortOrder), asc(suburbPagesTable.id));
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

adminSuburbPagesRouter.post("/", requireAdmin, async (req, res, next) => {
  const parsed = suburbPageSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  try {
    const [row] = await db
      .insert(suburbPagesTable)
      .values({ ...values(parsed.data), updatedAt: new Date() })
      .returning();
    res.status(201).json(row);
  } catch (err) {
    logger.error({ err }, "Failed to create suburb page");
    next(err);
  }
});

adminSuburbPagesRouter.put("/:id", requireAdmin, async (req, res, next) => {
  const id = Number(req.params["id"]);
  if (!id || isNaN(id)) {
    res.status(400).json({ error: "Invalid ID" });
    return;
  }
  const parsed = suburbPageSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  try {
    const [row] = await db
      .update(suburbPagesTable)
      .set({ ...values(parsed.data), updatedAt: new Date() })
      .where(eq(suburbPagesTable.id, id))
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

adminSuburbPagesRouter.delete("/:id", requireAdmin, async (req, res, next) => {
  const id = Number(req.params["id"]);
  if (!id || isNaN(id)) {
    res.status(400).json({ error: "Invalid ID" });
    return;
  }
  try {
    await db.delete(suburbPagesTable).where(eq(suburbPagesTable.id, id));
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});
