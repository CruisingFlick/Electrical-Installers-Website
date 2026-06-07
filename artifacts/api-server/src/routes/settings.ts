import { Router } from "express";
import { db, settings } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAdmin } from "../middleware/admin-auth";

const router = Router();

const SETTINGS_KEYS = ["googleReviewsUrl", "googlePlaceId"] as const;
type SettingsKey = (typeof SETTINGS_KEYS)[number];

async function getSettingsMap(): Promise<Record<SettingsKey, string>> {
  const rows = await db.select().from(settings);
  const map: Record<string, string> = {};
  for (const row of rows) {
    map[row.key] = row.value;
  }
  return {
    googleReviewsUrl: map["googleReviewsUrl"] ?? "",
    googlePlaceId: map["googlePlaceId"] ?? "",
  };
}

router.get("/", requireAdmin, async (req, res, next) => {
  try {
    res.json(await getSettingsMap());
  } catch (err) {
    next(err);
  }
});

router.put("/", requireAdmin, async (req, res, next) => {
  try {
    const body = req.body as Partial<Record<SettingsKey, string>>;

    for (const key of SETTINGS_KEYS) {
      if (key in body && body[key] !== undefined) {
        await db
          .insert(settings)
          .values({ key, value: body[key]! })
          .onConflictDoUpdate({
            target: settings.key,
            set: { value: body[key]!, updatedAt: new Date() },
          });
      }
    }

    res.json(await getSettingsMap());
  } catch (err) {
    next(err);
  }
});

router.get("/public", async (req, res, next) => {
  try {
    const rows = await db.select().from(settings).where(eq(settings.key, "googleReviewsUrl"));
    res.json({ googleReviewsUrl: rows[0]?.value ?? "" });
  } catch (err) {
    next(err);
  }
});

export default router;
