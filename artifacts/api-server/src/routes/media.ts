import { Router } from "express";
import { db, mediaTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { requireAdmin } from "../middleware/admin-auth";
import { CreateMediaItemBody, DeleteMediaItemParams } from "@workspace/api-zod";

const router = Router();

function formatItem(item: typeof mediaTable.$inferSelect) {
  return {
    ...item,
    tags: item.tags ?? [],
    createdAt: item.createdAt.toISOString(),
  };
}

router.get("/", requireAdmin, async (req, res, next) => {
  try {
    const rows = await db
      .select()
      .from(mediaTable)
      .orderBy(desc(mediaTable.createdAt));
    res.json(rows.map(formatItem));
  } catch (err) {
    next(err);
  }
});

router.post("/", requireAdmin, async (req, res, next) => {
  const parsed = CreateMediaItemBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  try {
    const [row] = await db
      .insert(mediaTable)
      .values({
        title: parsed.data.title,
        filename: parsed.data.filename,
        category: parsed.data.category ?? null,
        tags: parsed.data.tags ?? [],
        imageData: parsed.data.imageData,
      })
      .returning();

    res.status(201).json(formatItem(row));
  } catch (err) {
    next(err);
  }
});

router.patch("/:id", requireAdmin, async (req, res, next) => {
  const id = Number(req.params["id"]);
  if (!Number.isFinite(id)) {
    res.status(400).json({ error: "Invalid ID" });
    return;
  }

  const { title, category, tags } = req.body as {
    title?: string;
    category?: string;
    tags?: string[];
  };

  try {
    const [row] = await db
      .update(mediaTable)
      .set({
        ...(title !== undefined && { title }),
        ...(category !== undefined && { category }),
        ...(tags !== undefined && { tags }),
      })
      .where(eq(mediaTable.id, id))
      .returning();

    if (!row) {
      res.status(404).json({ error: "Not found" });
      return;
    }

    res.json(formatItem(row));
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", requireAdmin, async (req, res, next) => {
  const parsed = DeleteMediaItemParams.safeParse({ id: Number(req.params["id"]) });
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid ID" });
    return;
  }

  try {
    await db.delete(mediaTable).where(eq(mediaTable.id, parsed.data.id));
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;
