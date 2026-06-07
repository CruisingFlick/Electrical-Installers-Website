import { Router } from "express";
import { db, servicePagesTable } from "@workspace/db";
import { eq, asc } from "drizzle-orm";
import { z } from "zod";
import { requireAdmin } from "../middleware/admin-auth";
import { logger } from "../lib/logger";

const servicePageSchema = z.object({
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/, "Slug must be lowercase letters, numbers, and hyphens only"),
  title: z.string().min(1),
  shortDescription: z.string().min(1),
  fullDescription: z.string().min(1),
  bullets: z.array(z.string()),
  pricingBlurb: z.string().optional().nullable(),
  portfolioCategory: z.string().optional().nullable(),
  heroImageUrl: z.string().optional().nullable(),
  externalPath: z.string().optional().nullable(),
  sortOrder: z.number().int().optional(),
});

function values(data: z.infer<typeof servicePageSchema>) {
  return {
    slug: data.slug,
    title: data.title,
    shortDescription: data.shortDescription,
    fullDescription: data.fullDescription,
    bullets: data.bullets,
    pricingBlurb: data.pricingBlurb ?? null,
    portfolioCategory: data.portfolioCategory ?? null,
    heroImageUrl: data.heroImageUrl ?? null,
    externalPath: data.externalPath ?? null,
    sortOrder: data.sortOrder ?? 0,
  };
}

export const publicServicePagesRouter = Router();

publicServicePagesRouter.get("/", async (_req, res, next) => {
  try {
    const rows = await db
      .select()
      .from(servicePagesTable)
      .orderBy(asc(servicePagesTable.sortOrder), asc(servicePagesTable.id));
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

publicServicePagesRouter.get("/:slug", async (req, res, next) => {
  try {
    const [row] = await db
      .select()
      .from(servicePagesTable)
      .where(eq(servicePagesTable.slug, req.params["slug"]));
    if (!row) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    res.json(row);
  } catch (err) {
    next(err);
  }
});

export const adminServicePagesRouter = Router();

adminServicePagesRouter.get("/", requireAdmin, async (_req, res, next) => {
  try {
    const rows = await db
      .select()
      .from(servicePagesTable)
      .orderBy(asc(servicePagesTable.sortOrder), asc(servicePagesTable.id));
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

adminServicePagesRouter.post("/", requireAdmin, async (req, res, next) => {
  const parsed = servicePageSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  try {
    const [row] = await db
      .insert(servicePagesTable)
      .values({ ...values(parsed.data), updatedAt: new Date() })
      .returning();
    res.status(201).json(row);
  } catch (err) {
    logger.error({ err }, "Failed to create service page");
    next(err);
  }
});

adminServicePagesRouter.put("/:id", requireAdmin, async (req, res, next) => {
  const id = Number(req.params["id"]);
  if (!id || isNaN(id)) {
    res.status(400).json({ error: "Invalid ID" });
    return;
  }
  const parsed = servicePageSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  try {
    const [row] = await db
      .update(servicePagesTable)
      .set({ ...values(parsed.data), updatedAt: new Date() })
      .where(eq(servicePagesTable.id, id))
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

adminServicePagesRouter.delete("/:id", requireAdmin, async (req, res, next) => {
  const id = Number(req.params["id"]);
  if (!id || isNaN(id)) {
    res.status(400).json({ error: "Invalid ID" });
    return;
  }
  try {
    await db.delete(servicePagesTable).where(eq(servicePagesTable.id, id));
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});
