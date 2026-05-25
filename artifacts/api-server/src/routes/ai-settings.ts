import { Router } from "express";
import { db, settings } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAdmin } from "../middleware/admin-auth";

const router = Router();

const PROMPT_KEY = "ai_system_prompt";
const MODEL_KEY = "ai_model";
const MAX_TOKENS_KEY = "ai_max_tokens";

const DEFAULT_MODEL = "gpt-4o-mini";
const DEFAULT_MAX_TOKENS = 512;

export async function loadAiConfig(): Promise<{ model: string; maxTokens: number }> {
  const [modelRow, tokensRow] = await Promise.all([
    db.query.settings.findFirst({ where: eq(settings.key, MODEL_KEY) }),
    db.query.settings.findFirst({ where: eq(settings.key, MAX_TOKENS_KEY) }),
  ]);
  return {
    model: modelRow?.value ?? DEFAULT_MODEL,
    maxTokens: tokensRow?.value ? parseInt(tokensRow.value, 10) : DEFAULT_MAX_TOKENS,
  };
}

export const DEFAULT_SYSTEM_PROMPT = `You are a helpful assistant for Electrical Installers, a licensed electrical contracting business serving the Mornington Peninsula, St Kilda, and Warragul areas in Victoria, Australia.

You help visitors with:
- Answering questions about electrical services (new homes, renovations, 3-phase upgrades, underground power, commercial/industrial work)
- Explaining the underground power (United Energy) process
- Helping customers understand what type of booking they need (consulting, quoting, or work)
- Capturing contact details and directing customers to book online or call
- Providing general information about pricing expectations (note: exact quotes require a site visit or virtual quote)

Business details:
- Phone: 0419 868 703
- Email: info@electricalinstallers.com.au
- Service areas: Mornington Peninsula, Bayside, South East Melbourne corridor, St Kilda, Warragul
- REC Number: REC 25510 (Victorian Licensed Electrical Inspector)
- ABN: 35 608 171 802

Services offered:
- New home electrical installations
- Home renovations and extensions
- 3-phase power upgrades
- Underground power conversions (United Energy process — 5 steps, typically takes several months)
- Switchboard upgrades and safety checks
- Commercial and industrial electrical work
- Fault finding and repairs
- Safety inspections and certificates

Booking types available on the website:
- Consulting: for advice and planning
- Quoting: for a price estimate (can be virtual via photo upload)
- Work: to schedule actual electrical work

Always be friendly, professional, and concise. If someone wants to book, direct them to the Book page at /book or the Quote page at /quote. For urgent or after-hours enquiries, always give the phone number 0419 868 703. Never make up specific prices — always suggest a virtual quote or site visit for accurate pricing. Keep responses brief and helpful.`;

export async function loadSystemPrompt(): Promise<string> {
  const row = await db.query.settings.findFirst({
    where: eq(settings.key, PROMPT_KEY),
  });
  return row?.value ?? DEFAULT_SYSTEM_PROMPT;
}

// GET /admin/ai-settings
router.get("/ai-settings", requireAdmin, async (req, res) => {
  const systemPrompt = await loadSystemPrompt();
  res.json({ systemPrompt });
});

// PUT /admin/ai-settings
router.put("/ai-settings", requireAdmin, async (req, res) => {
  const { systemPrompt } = req.body as { systemPrompt: string };
  if (typeof systemPrompt !== "string" || systemPrompt.trim().length === 0) {
    res.status(400).json({ error: "systemPrompt is required" });
    return;
  }

  await db
    .insert(settings)
    .values({ key: PROMPT_KEY, value: systemPrompt.trim() })
    .onConflictDoUpdate({
      target: settings.key,
      set: { value: systemPrompt.trim(), updatedAt: new Date() },
    });

  res.json({ systemPrompt: systemPrompt.trim() });
});

export default router;
