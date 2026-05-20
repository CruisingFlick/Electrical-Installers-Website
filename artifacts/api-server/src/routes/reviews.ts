import { Router } from "express";
import { db, reviewsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import {
  CreateReviewBody,
  UpdateReviewStatusBody,
  UpdateReviewStatusParams,
  DeleteReviewParams,
  ListReviewsQueryParams,
} from "@workspace/api-zod";
import { requireAdmin } from "../middleware/admin-auth";

const router = Router();

function formatReview(r: typeof reviewsTable.$inferSelect) {
  return {
    ...r,
    createdAt: r.createdAt.toISOString(),
  };
}

router.get("/", async (req, res, next) => {
  try {
    const parsed = ListReviewsQueryParams.safeParse(req.query);
    const status = parsed.success ? parsed.data.status : undefined;

    const rows = await db
      .select()
      .from(reviewsTable)
      .where(status ? eq(reviewsTable.status, status) : undefined)
      .orderBy(desc(reviewsTable.createdAt));

    res.json(rows.map(formatReview));
  } catch (err) {
    next(err);
  }
});

router.post("/", async (req, res, next) => {
  const parsed = CreateReviewBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  try {
    const [row] = await db
      .insert(reviewsTable)
      .values({ ...parsed.data, status: "pending", isVerified: false })
      .returning();

    res.status(201).json(formatReview(row));
  } catch (err) {
    next(err);
  }
});

router.patch("/:id", requireAdmin, async (req, res, next) => {
  const paramParsed = UpdateReviewStatusParams.safeParse({
    id: Number(req.params["id"]),
  });
  if (!paramParsed.success) {
    res.status(400).json({ error: "Invalid ID" });
    return;
  }

  const bodyParsed = UpdateReviewStatusBody.safeParse(req.body);
  if (!bodyParsed.success) {
    res.status(400).json({ error: bodyParsed.error.message });
    return;
  }

  try {
    const [row] = await db
      .update(reviewsTable)
      .set({ status: bodyParsed.data.status })
      .where(eq(reviewsTable.id, paramParsed.data.id))
      .returning();

    if (!row) {
      res.status(404).json({ error: "Not found" });
      return;
    }

    res.json(formatReview(row));
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", requireAdmin, async (req, res, next) => {
  const parsed = DeleteReviewParams.safeParse({ id: Number(req.params["id"]) });
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid ID" });
    return;
  }

  try {
    await db.delete(reviewsTable).where(eq(reviewsTable.id, parsed.data.id));
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;
