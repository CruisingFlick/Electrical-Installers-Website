import { Router } from "express";
import { db, jobsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import {
  CreateJobBody,
  UpdateJobStatusBody,
  UpdateJobStatusParams,
  DeleteJobParams,
} from "@workspace/api-zod";

const router = Router();

function formatJob(j: typeof jobsTable.$inferSelect) {
  return {
    ...j,
    createdAt: j.createdAt.toISOString(),
  };
}

router.get("/", async (req, res) => {
  const rows = await db
    .select()
    .from(jobsTable)
    .orderBy(desc(jobsTable.createdAt));

  res.json(rows.map(formatJob));
});

router.post("/", async (req, res) => {
  const parsed = CreateJobBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [row] = await db
    .insert(jobsTable)
    .values({ ...parsed.data, status: "pending" })
    .returning();

  res.status(201).json(formatJob(row));
});

router.patch("/:id", async (req, res) => {
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
});

router.delete("/:id", async (req, res) => {
  const parsed = DeleteJobParams.safeParse({ id: Number(req.params["id"]) });
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid ID" });
    return;
  }

  await db.delete(jobsTable).where(eq(jobsTable.id, parsed.data.id));
  res.status(204).send();
});

export default router;
