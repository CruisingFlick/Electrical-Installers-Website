import { Router } from "express";
import { db, blogPostsTable } from "@workspace/db";
import { eq, desc, and } from "drizzle-orm";
import { z } from "zod";
import { requireAdmin } from "../middleware/admin-auth";
import { logger } from "../lib/logger";

const createBlogPostSchema = z.object({
  title: z.string().min(1),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/, "Slug must be lowercase letters, numbers, and hyphens only"),
  excerpt: z.string().min(1),
  content: z.string().min(1),
  imageUrl: z.string().optional().nullable(),
  category: z.string().min(1),
  status: z.enum(["draft", "published"]),
  publishedAt: z.string().optional().nullable(),
});

function formatPost(p: typeof blogPostsTable.$inferSelect) {
  return {
    ...p,
    publishedAt: p.publishedAt ? p.publishedAt.toISOString() : null,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  };
}

export const publicBlogRouter = Router();

publicBlogRouter.get("/", async (req, res, next) => {
  try {
    const category = req.query["category"] as string | undefined;
    const conditions = [eq(blogPostsTable.status, "published")];
    if (category) conditions.push(eq(blogPostsTable.category, category));

    const rows = await db
      .select()
      .from(blogPostsTable)
      .where(and(...conditions))
      .orderBy(desc(blogPostsTable.publishedAt), desc(blogPostsTable.createdAt));

    res.json(rows.map(formatPost));
  } catch (err) {
    next(err);
  }
});

publicBlogRouter.get("/:slug", async (req, res, next) => {
  try {
    const [row] = await db
      .select()
      .from(blogPostsTable)
      .where(
        and(
          eq(blogPostsTable.slug, req.params["slug"]),
          eq(blogPostsTable.status, "published")
        )
      );

    if (!row) {
      res.status(404).json({ error: "Not found" });
      return;
    }

    res.json(formatPost(row));
  } catch (err) {
    next(err);
  }
});

export const adminBlogRouter = Router();

adminBlogRouter.get("/", requireAdmin, async (req, res, next) => {
  try {
    const rows = await db
      .select()
      .from(blogPostsTable)
      .orderBy(desc(blogPostsTable.createdAt));
    res.json(rows.map(formatPost));
  } catch (err) {
    next(err);
  }
});

adminBlogRouter.post("/", requireAdmin, async (req, res, next) => {
  const parsed = createBlogPostSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  try {
    const now = new Date();
    const publishedAt =
      parsed.data.status === "published"
        ? parsed.data.publishedAt
          ? new Date(parsed.data.publishedAt)
          : now
        : null;

    const [row] = await db
      .insert(blogPostsTable)
      .values({
        ...parsed.data,
        imageUrl: parsed.data.imageUrl ?? null,
        publishedAt,
        updatedAt: now,
      })
      .returning();

    res.status(201).json(formatPost(row));
  } catch (err) {
    logger.error({ err }, "Failed to create blog post");
    next(err);
  }
});

adminBlogRouter.put("/:id", requireAdmin, async (req, res, next) => {
  const id = Number(req.params["id"]);
  if (!id || isNaN(id)) {
    res.status(400).json({ error: "Invalid ID" });
    return;
  }

  const parsed = createBlogPostSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  try {
    const now = new Date();
    const [existing] = await db.select().from(blogPostsTable).where(eq(blogPostsTable.id, id));
    const publishedAt =
      parsed.data.status === "published"
        ? parsed.data.publishedAt
          ? new Date(parsed.data.publishedAt)
          : existing?.publishedAt ?? now
        : null;

    const [row] = await db
      .update(blogPostsTable)
      .set({
        ...parsed.data,
        imageUrl: parsed.data.imageUrl ?? null,
        publishedAt,
        updatedAt: now,
      })
      .where(eq(blogPostsTable.id, id))
      .returning();

    if (!row) {
      res.status(404).json({ error: "Not found" });
      return;
    }

    res.json(formatPost(row));
  } catch (err) {
    next(err);
  }
});

adminBlogRouter.delete("/:id", requireAdmin, async (req, res, next) => {
  const id = Number(req.params["id"]);
  if (!id || isNaN(id)) {
    res.status(400).json({ error: "Invalid ID" });
    return;
  }

  try {
    await db.delete(blogPostsTable).where(eq(blogPostsTable.id, id));
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});
