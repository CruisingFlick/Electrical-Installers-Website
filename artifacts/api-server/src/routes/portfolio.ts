import { Router } from "express";
import { db, portfolioTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import {
  CreatePortfolioItemBody,
  DeletePortfolioItemParams,
  ListPortfolioItemsQueryParams,
  UpdatePortfolioItemBody,
  UpdatePortfolioItemParams,
} from "@workspace/api-zod";

const router = Router();

function formatItem(item: typeof portfolioTable.$inferSelect) {
  return {
    ...item,
    beforeImageUrls: item.beforeImageUrls ?? [],
    afterImageUrls: item.afterImageUrls ?? [],
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

  try {
    const [row] = await db
      .insert(portfolioTable)
      .values({
        title: parsed.data.title,
        description: parsed.data.description,
        category: parsed.data.category,
        suburb: parsed.data.suburb,
        completedDate: parsed.data.completedDate,
        afterImageUrls: parsed.data.afterImageUrls,
        beforeImageUrls: parsed.data.beforeImageUrls ?? [],
      })
      .returning();

    res.status(201).json(formatItem(row));
  } catch (err: unknown) {
    const drizzleErr = err as { message?: string; cause?: { message?: string; code?: string; detail?: string } };
    const cause = drizzleErr.cause;
    req.log.error({ pgCode: cause?.code, pgDetail: cause?.detail, pgMsg: cause?.message }, "portfolio insert failed");
    res.status(500).json({ error: "Failed to save portfolio item" });
  }
});

router.put("/:id", async (req, res) => {
  const parsedParams = UpdatePortfolioItemParams.safeParse({
    id: Number(req.params["id"]),
  });
  if (!parsedParams.success) {
    res.status(400).json({ error: "Invalid ID" });
    return;
  }

  const parsedBody = UpdatePortfolioItemBody.safeParse(req.body);
  if (!parsedBody.success) {
    res.status(400).json({ error: parsedBody.error.message });
    return;
  }

  const [row] = await db
    .update(portfolioTable)
    .set(parsedBody.data)
    .where(eq(portfolioTable.id, parsedParams.data.id))
    .returning();

  if (!row) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  res.json(formatItem(row));
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
