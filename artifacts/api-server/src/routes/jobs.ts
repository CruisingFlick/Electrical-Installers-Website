import { Router } from "express";
import { db, jobsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import {
  CreateJobBody,
  UpdateJobStatusBody,
  UpdateJobStatusParams,
  DeleteJobParams,
} from "@workspace/api-zod";
import { requireAdmin } from "../middleware/admin-auth";

const router = Router();

function formatJob(j: typeof jobsTable.$inferSelect) {
  return {
    ...j,
    createdAt: j.createdAt.toISOString(),
  };
}

router.get("/", requireAdmin, async (req, res, next) => {
  try {
    const rows = await db
      .select()
      .from(jobsTable)
      .orderBy(desc(jobsTable.createdAt));
    res.json(rows.map(formatJob));
  } catch (err) {
    next(err);
  }
});

router.post("/", requireAdmin, async (req, res, next) => {
  const parsed = CreateJobBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  try {
    const [row] = await db
      .insert(jobsTable)
      .values({ ...parsed.data, status: "pending" })
      .returning();
    res.status(201).json(formatJob(row));
  } catch (err) {
    next(err);
  }
});

router.patch("/:id", requireAdmin, async (req, res, next) => {
  const paramParsed = UpdateJobStatusParams.safeParse({
    id: Number(req.params["id"]),
  });
  if (!paramParsed.success) {
    res.status(400).json({ error: "Invalid ID" });
    return;
  }

  const bodyParsed = UpdateJobStatusBody.safeParse(req.body);
  if (!bodyParsed.success) {
    res.status(400).json({ error: bodyParsed.error.message });
    return;
  }

  try {
    const [row] = await db
      .update(jobsTable)
      .set({ status: bodyParsed.data.status })
      .where(eq(jobsTable.id, paramParsed.data.id))
      .returning();

    if (!row) {
      res.status(404).json({ error: "Not found" });
      return;
    }

    res.json(formatJob(row));
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", requireAdmin, async (req, res, next) => {
  const parsed = DeleteJobParams.safeParse({ id: Number(req.params["id"]) });
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid ID" });
    return;
  }

  try {
    await db.delete(jobsTable).where(eq(jobsTable.id, parsed.data.id));
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;
