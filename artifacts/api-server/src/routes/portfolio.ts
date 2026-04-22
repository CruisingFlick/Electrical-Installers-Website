import { Router } from "express";
import { db, portfolioTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import {
  CreatePortfolioItemBody,
  DeletePortfolioItemParams,
  ListPortfolioItemsQueryParams,
} from "@workspace/api-zod";

const router = Router();

function formatItem(item: typeof portfolioTable.$inferSelect) {
  return {
    ...item,
    createdAt: item.createdAt.toISOString(),
  };
}

router.get("/", async (req, res) => {
  const parsed = ListPortfolioItemsQueryParams.safeParse(req.query);
  const category = parsed.success ? parsed.data.category : undefined;

  const rows = await db
    .select()
    .from(portfolioTable)
    .where(category ? eq(portfolioTable.category, category) : undefined)
    .orderBy(desc(portfolioTable.createdAt));

  res.json(rows.map(formatItem));
});

router.post("/", async (req, res) => {
  const parsed = CreatePortfolioItemBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [row] = await db
    .insert(portfolioTable)
    .values(parsed.data)
    .returning();

  res.status(201).json(formatItem(row));
});

router.delete("/:id", async (req, res) => {
  const parsed = DeletePortfolioItemParams.safeParse({
    id: Number(req.params["id"]),
  });
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid ID" });
    return;
  }

  await db.delete(portfolioTable).where(eq(portfolioTable.id, parsed.data.id));
  res.status(204).send();
});

export default router;
