import { Router } from "express";
import { db, bookingsTable, settings } from "@workspace/db";
import { desc, eq } from "drizzle-orm";
import { timingSafeEqual, randomBytes } from "node:crypto";
import { requireAdmin } from "../middleware/admin-auth";
import { parseAuDateTime, wrapCalendar, type IcalEventInput } from "../lib/ical";

export const calendarPublicRouter = Router();
export const calendarAdminRouter = Router();

const FEED_TOKEN_KEY = "calendarFeedToken";

// Persistent feed token. An explicit CALENDAR_FEED_TOKEN env var wins; otherwise
// a token is generated once and stored in the settings table so the subscribe URL
// stays stable across restarts and SESSION_SECRET rotation ("subscribe once").
async function getOrCreateFeedToken(): Promise<string> {
  const explicit = process.env["CALENDAR_FEED_TOKEN"];
  if (explicit && explicit.trim()) return explicit.trim();

  const [existing] = await db.select().from(settings).where(eq(settings.key, FEED_TOKEN_KEY));
  if (existing?.value) return existing.value;

  const token = randomBytes(24).toString("hex");
  const [row] = await db
    .insert(settings)
    .values({ key: FEED_TOKEN_KEY, value: token })
    .onConflictDoNothing({ target: settings.key })
    .returning();
  if (row?.value) return row.value;

  // Lost the race to another request that inserted first — read it back.
  const [winner] = await db.select().from(settings).where(eq(settings.key, FEED_TOKEN_KEY));
  return winner?.value ?? token;
}

function tokensMatch(provided: string, expected: string): boolean {
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

// Public, token-gated subscribable feed. Calendar apps (Google/Apple/Outlook)
// poll this URL periodically and keep the owner's calendar in sync automatically.
calendarPublicRouter.get("/feed.ics", async (req, res, next) => {
  try {
    const provided = String(req.query["token"] ?? "");
    const expected = await getOrCreateFeedToken();
    if (!provided || !tokensMatch(provided, expected)) {
      res.status(403).type("text/plain").send("Forbidden");
      return;
    }

    const rows = await db
      .select()
      .from(bookingsTable)
      .orderBy(desc(bookingsTable.createdAt));

    const events: IcalEventInput[] = [];
    for (const b of rows) {
      if (b.status === "cancelled") continue;
      const start = parseAuDateTime(b.preferredDate);
      if (!start) continue;
      const descParts = [
        `${b.serviceType} — ${b.jobType}`,
        b.customerPhone ? `Phone: ${b.customerPhone}` : "",
        b.customerEmail ? `Email: ${b.customerEmail}` : "",
        b.message ? `Notes: ${b.message}` : "",
        `Status: ${b.status}`,
      ].filter(Boolean);
      events.push({
        uid: `booking-${b.id}@electricalinstallers.com.au`,
        start,
        durationMins: 60,
        summary: `${b.customerName} — ${b.serviceType}`,
        description: descParts.join("\n"),
        location: b.suburb || undefined,
      });
    }

    const ics = wrapCalendar(events, { name: "Electrical Installers — Jobs" });
    res.setHeader("Content-Type", "text/calendar; charset=utf-8");
    res.setHeader("Cache-Control", "no-cache, max-age=0");
    res.send(ics);
  } catch (err) {
    next(err);
  }
});

// Admin-only: returns the subscribe URLs (with the secret token) for display.
calendarAdminRouter.get("/feed-url", requireAdmin, async (req, res, next) => {
  try {
    const token = await getOrCreateFeedToken();
    const forwardedProto = (req.headers["x-forwarded-proto"] as string | undefined)?.split(",")[0]?.trim();
    const proto = forwardedProto || req.protocol || "https";
    const host = req.get("host") ?? "";
    const path = `/api/calendar/feed.ics?token=${encodeURIComponent(token)}`;
    const httpsUrl = `${proto}://${host}${path}`;
    const webcalUrl = `webcal://${host}${path}`;
    res.json({ httpsUrl, webcalUrl });
  } catch (err) {
    next(err);
  }
});
