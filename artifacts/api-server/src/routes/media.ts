import { Router } from "express";
import { db, mediaTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { z } from "zod";
import { requireAdmin } from "../middleware/admin-auth";
import { CreateMediaItemBody, DeleteMediaItemParams } from "@workspace/api-zod";

const patchMediaSchema = z.object({
  title: z.string().optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

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

  const { imageData } = parsed.data;
  if (
    !imageData.startsWith("data:image/jpeg;base64,") &&
    !imageData.startsWith("data:image/png;base64,") &&
    !imageData.startsWith("data:image/webp;base64,") &&
    !imageData.startsWith("data:image/gif;base64,")
  ) {
    res.status(400).json({ error: "imageData must be a base64-encoded JPEG, PNG, WebP, or GIF." });
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

  const bodyParsed = patchMediaSchema.safeParse(req.body);
  if (!bodyParsed.success) {
    res.status(400).json({ error: bodyParsed.error.message });
    return;
  }

  const { title, category, tags } = bodyParsed.data;

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
