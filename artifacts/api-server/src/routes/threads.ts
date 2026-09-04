import { Router, type IRouter } from "express";
import { db, threads, threadMessages } from "@workspace/db";
import {
  eq,
  desc,
  asc,
  sql,
  and,
  isNotNull,
  isNull,
  lte,
  or,
} from "drizzle-orm";
import {
  CreateThreadBody,
  CreateThreadMessageBody,
  CreateThreadMessageParams,
  CreateThreadMessageQueryParams,
  GetThreadParams,
  GetThreadQueryParams,
  GetAdminThreadParams,
  ReplyToThreadBody,
  ReplyToThreadParams,
  UpdateThreadBody,
  UpdateThreadParams,
} from "@workspace/api-zod";
import he from "he";
import { requireAdmin } from "../middleware/admin-auth";
import { logger } from "../lib/logger";
import { BUSINESS_EMAIL, ADMIN_BASE_URL, ADMIN_PHONE } from "../lib/constants";
import {
  getSmsDeliveryStatus,
  parseSmsDeliveryReceipt,
  sendSms,
  verifyClickSendWebhookToken,
} from "../lib/clicksend";
import { sendEmail } from "../lib/resend";

const MAX_BODY_LEN = 5000;
const MAX_PHOTO_LEN = 4_000_000; // ~3MB base64 data URL
const SMS_STATUS_FALLBACK_INTERVAL_MS = 5 * 60 * 1000;

function formatThread(t: typeof threads.$inferSelect) {
  return {
    ...t,
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
  };
}

function formatThreadList(t: typeof threads.$inferSelect) {
  const { accessToken: _omit, ...rest } = t;
  return {
    ...rest,
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
  };
}

function formatMessage(m: typeof threadMessages.$inferSelect) {
  return {
    ...m,
    createdAt: m.createdAt.toISOString(),
    smsStatusUpdatedAt: m.smsStatusUpdatedAt?.toISOString() ?? null,
  };
}

async function refreshSmsDeliveryStatuses(
  messages: Array<typeof threadMessages.$inferSelect>,
): Promise<Array<typeof threadMessages.$inferSelect>> {
  const refreshed = await Promise.all(
    messages.map(async (message) => {
      if (message.sender !== "admin" || message.smsStatus !== "sent" || !message.smsMessageId) {
        return message;
      }
      const now = new Date();
      const staleBefore = new Date(now.getTime() - SMS_STATUS_FALLBACK_INTERVAL_MS);
      if (message.smsStatusUpdatedAt && message.smsStatusUpdatedAt > staleBefore) {
        return message;
      }

      // Atomically claim this fallback check before contacting ClickSend. Frequent
      // or concurrent admin reads then use the stored state instead of polling.
      const [claimed] = await db
        .update(threadMessages)
        .set({ smsStatusUpdatedAt: now })
        .where(
          and(
            eq(threadMessages.id, message.id),
            eq(threadMessages.smsStatus, "sent"),
            or(
              isNull(threadMessages.smsStatusUpdatedAt),
              lte(threadMessages.smsStatusUpdatedAt, staleBefore),
            ),
          ),
        )
        .returning();
      if (!claimed) return message;

      const status = await getSmsDeliveryStatus(claimed.smsMessageId!);
      if (!status || status === claimed.smsStatus) return claimed;
      const [updated] = await db
        .update(threadMessages)
        .set({ smsStatus: status, smsStatusUpdatedAt: new Date() })
        .where(
          and(
            eq(threadMessages.id, claimed.id),
            eq(threadMessages.smsStatus, "sent"),
            isNotNull(threadMessages.smsMessageId),
          ),
        )
        .returning();
      if (updated) return updated;
      const [current] = await db
        .select()
        .from(threadMessages)
        .where(eq(threadMessages.id, claimed.id));
      return current ?? claimed;
    }),
  );
  return refreshed;
}

function validateContent(body: string, photoUrl?: string | null): string | null {
  if (body.length > MAX_BODY_LEN) return "Message is too long.";
  if (photoUrl && photoUrl.length > MAX_PHOTO_LEN) return "Photo is too large.";
  if (photoUrl && !/^data:image\/[a-z+]+;base64,/i.test(photoUrl)) {
    return "Invalid photo format.";
  }
  return null;
}

async function sendNewMessageEmail(opts: {
  customerName: string;
  customerPhone: string;
  body: string;
  hasPhoto: boolean;
}) {
  try {
    await sendEmail({
      to: BUSINESS_EMAIL,
      subject: `New customer message — ${opts.customerName}`,
      text: [
        "NEW CUSTOMER MESSAGE",
        "--------------------",
        `Name:    ${opts.customerName}`,
        `Phone:   ${opts.customerPhone}`,
        `Message:\n${opts.body}`,
        opts.hasPhoto ? "\n[A photo was attached]" : "",
        "",
        `Reply in admin: ${ADMIN_BASE_URL}/messages`,
      ].join("\n"),
      html: `
        <h2 style="color:#1a3a5c;">New Customer Message</h2>
        <table style="border-collapse:collapse;width:100%;max-width:560px;font-family:sans-serif;font-size:14px;">
          <tr><td style="padding:6px 12px;font-weight:bold;background:#f5f5f5;width:140px;">Name</td><td style="padding:6px 12px;">${he.escape(opts.customerName)}</td></tr>
          <tr><td style="padding:6px 12px;font-weight:bold;background:#f5f5f5;">Phone</td><td style="padding:6px 12px;"><a href="tel:${he.escape(opts.customerPhone)}">${he.escape(opts.customerPhone)}</a></td></tr>
          <tr><td style="padding:6px 12px;font-weight:bold;background:#f5f5f5;">Message</td><td style="padding:6px 12px;">${he.escape(opts.body)}</td></tr>
          ${opts.hasPhoto ? `<tr><td style="padding:6px 12px;font-weight:bold;background:#f5f5f5;">Photo</td><td style="padding:6px 12px;">A photo was attached</td></tr>` : ""}
        </table>
        <p style="margin-top:16px;"><a href="${ADMIN_BASE_URL}/messages" style="background:#f97316;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;font-weight:bold;">Reply in Admin</a></p>
      `,
    });
  } catch (err) {
    logger.error({ err }, "Failed to send new message email notification");
  }
}

// ---------- Public routes (mounted at /threads) ----------
const publicRouter: IRouter = Router();
const webhookRouter: IRouter = Router();

webhookRouter.post("/sms-receipts", async (req, res, next) => {
  const token =
    req.get("x-clicksend-webhook-token") ??
    (typeof req.query["token"] === "string" ? req.query["token"] : undefined);
  if (!verifyClickSendWebhookToken(token)) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const receipt = parseSmsDeliveryReceipt(req.body);
  if (!receipt) {
    res.status(400).json({ error: "Invalid delivery receipt" });
    return;
  }

  try {
    // Only pending messages may transition. This makes duplicate callbacks safe
    // and prevents a late/out-of-order receipt from downgrading a terminal state.
    const updated = await db
      .update(threadMessages)
      .set({ smsStatus: receipt.status, smsStatusUpdatedAt: new Date() })
      .where(
        and(
          eq(threadMessages.smsMessageId, receipt.messageId),
          eq(threadMessages.smsStatus, "sent"),
        ),
      )
      .returning({ id: threadMessages.id });

    if (updated.length === 0) {
      logger.info(
        { messageId: receipt.messageId, status: receipt.status },
        "ClickSend receipt was already applied or did not match a pending message",
      );
    }
    res.status(200).json({ received: true });
  } catch (err) {
    next(err);
  }
});

publicRouter.post("/", async (req, res, next) => {
  const parsed = CreateThreadBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const contentError = validateContent(parsed.data.message, parsed.data.photoUrl);
  if (contentError) {
    res.status(400).json({ error: contentError });
    return;
  }

  try {
    const [thread] = await db
      .insert(threads)
      .values({
        customerName: parsed.data.customerName,
        customerPhone: parsed.data.customerPhone,
        customerEmail: parsed.data.customerEmail ?? null,
        referenceType: parsed.data.referenceType ?? null,
        referenceId: parsed.data.referenceId ?? null,
        status: "open",
        unreadForAdmin: 1,
      })
      .returning();

    if (!thread) {
      res.status(500).json({ error: "Failed to create thread" });
      return;
    }

    const [message] = await db
      .insert(threadMessages)
      .values({
        threadId: thread.id,
        sender: "customer",
        body: parsed.data.message,
        photoUrl: parsed.data.photoUrl ?? null,
      })
      .returning();

    void sendNewMessageEmail({
      customerName: thread.customerName,
      customerPhone: thread.customerPhone,
      body: parsed.data.message,
      hasPhoto: Boolean(parsed.data.photoUrl),
    });

    const isCallback = thread.referenceType === "callback";
    const snippet =
      parsed.data.message.length > 120
        ? parsed.data.message.slice(0, 117) + "..."
        : parsed.data.message;
    void sendSms(
      ADMIN_PHONE,
      `${isCallback ? "New callback request" : "New customer message"} from ${thread.customerName} (${thread.customerPhone}): "${snippet}"${parsed.data.photoUrl ? " [photo]" : ""} — reply: ${ADMIN_BASE_URL}/messages`
    );

    res.status(201).json({
      ...formatThread(thread),
      messages: message ? [formatMessage(message)] : [],
    });
  } catch (err) {
    next(err);
  }
});

publicRouter.get("/:id", async (req, res, next) => {
  const paramParsed = GetThreadParams.safeParse({ id: Number(req.params["id"]) });
  const queryParsed = GetThreadQueryParams.safeParse(req.query);
  if (!paramParsed.success || !queryParsed.success) {
    res.status(400).json({ error: "Invalid request" });
    return;
  }

  try {
    const [thread] = await db
      .select()
      .from(threads)
      .where(eq(threads.id, paramParsed.data.id));

    if (!thread || thread.accessToken !== queryParsed.data.token) {
      res.status(404).json({ error: "Not found" });
      return;
    }

    const messages = await db
      .select()
      .from(threadMessages)
      .where(eq(threadMessages.threadId, thread.id))
      .orderBy(asc(threadMessages.createdAt));

    await db
      .update(threads)
      .set({ unreadForCustomer: 0 })
      .where(eq(threads.id, thread.id));

    res.json({
      ...formatThreadList({ ...thread, unreadForCustomer: 0 }),
      messages: messages.map(formatMessage),
    });
  } catch (err) {
    next(err);
  }
});

publicRouter.post("/:id/messages", async (req, res, next) => {
  const paramParsed = CreateThreadMessageParams.safeParse({
    id: Number(req.params["id"]),
  });
  const queryParsed = CreateThreadMessageQueryParams.safeParse(req.query);
  if (!paramParsed.success || !queryParsed.success) {
    res.status(400).json({ error: "Invalid request" });
    return;
  }

  const bodyParsed = CreateThreadMessageBody.safeParse(req.body);
  if (!bodyParsed.success) {
    res.status(400).json({ error: bodyParsed.error.message });
    return;
  }

  const contentError = validateContent(bodyParsed.data.body, bodyParsed.data.photoUrl);
  if (contentError) {
    res.status(400).json({ error: contentError });
    return;
  }

  try {
    const [thread] = await db
      .select()
      .from(threads)
      .where(eq(threads.id, paramParsed.data.id));

    if (!thread || thread.accessToken !== queryParsed.data.token) {
      res.status(404).json({ error: "Not found" });
      return;
    }

    const [message] = await db
      .insert(threadMessages)
      .values({
        threadId: thread.id,
        sender: "customer",
        body: bodyParsed.data.body,
        photoUrl: bodyParsed.data.photoUrl ?? null,
      })
      .returning();

    await db
      .update(threads)
      .set({
        unreadForAdmin: sql`${threads.unreadForAdmin} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(threads.id, thread.id));

    void sendNewMessageEmail({
      customerName: thread.customerName,
      customerPhone: thread.customerPhone,
      body: bodyParsed.data.body,
      hasPhoto: Boolean(bodyParsed.data.photoUrl),
    });

    const followUpSnippet =
      bodyParsed.data.body.length > 120
        ? bodyParsed.data.body.slice(0, 117) + "..."
        : bodyParsed.data.body;
    void sendSms(
      ADMIN_PHONE,
      `New reply from ${thread.customerName} (${thread.customerPhone}): "${followUpSnippet}"${bodyParsed.data.photoUrl ? " [photo]" : ""} — reply: ${ADMIN_BASE_URL}/messages`
    );

    res.status(201).json(message ? formatMessage(message) : null);
  } catch (err) {
    next(err);
  }
});

// ---------- Admin routes (mounted at /admin/threads) ----------
const adminRouter: IRouter = Router();

adminRouter.get("/", requireAdmin, async (_req, res, next) => {
  try {
    const rows = await db
      .select()
      .from(threads)
      .orderBy(desc(threads.updatedAt));

    res.json(rows.map(formatThreadList));
  } catch (err) {
    next(err);
  }
});

adminRouter.get("/:id", requireAdmin, async (req, res, next) => {
  const paramParsed = GetAdminThreadParams.safeParse({
    id: Number(req.params["id"]),
  });
  if (!paramParsed.success) {
    res.status(400).json({ error: "Invalid ID" });
    return;
  }

  try {
    const [thread] = await db
      .select()
      .from(threads)
      .where(eq(threads.id, paramParsed.data.id));

    if (!thread) {
      res.status(404).json({ error: "Not found" });
      return;
    }

    const storedMessages = await db
      .select()
      .from(threadMessages)
      .where(eq(threadMessages.threadId, thread.id))
      .orderBy(asc(threadMessages.createdAt));
    const messages = await refreshSmsDeliveryStatuses(storedMessages);

    res.json({
      ...formatThreadList(thread),
      messages: messages.map(formatMessage),
    });
  } catch (err) {
    next(err);
  }
});

adminRouter.patch("/:id", requireAdmin, async (req, res, next) => {
  const paramParsed = UpdateThreadParams.safeParse({
    id: Number(req.params["id"]),
  });
  if (!paramParsed.success) {
    res.status(400).json({ error: "Invalid ID" });
    return;
  }

  const bodyParsed = UpdateThreadBody.safeParse(req.body);
  if (!bodyParsed.success) {
    res.status(400).json({ error: bodyParsed.error.message });
    return;
  }

  try {
    const updates: Partial<typeof threads.$inferInsert> = {};
    if (bodyParsed.data.status) updates.status = bodyParsed.data.status;
    if (bodyParsed.data.markReadForAdmin) updates.unreadForAdmin = 0;

    if (Object.keys(updates).length === 0) {
      res.status(400).json({ error: "No updates provided" });
      return;
    }

    const [row] = await db
      .update(threads)
      .set(updates)
      .where(eq(threads.id, paramParsed.data.id))
      .returning();

    if (!row) {
      res.status(404).json({ error: "Not found" });
      return;
    }

    res.json(formatThreadList(row));
  } catch (err) {
    next(err);
  }
});

adminRouter.post("/:id/reply", requireAdmin, async (req, res, next) => {
  const paramParsed = ReplyToThreadParams.safeParse({
    id: Number(req.params["id"]),
  });
  if (!paramParsed.success) {
    res.status(400).json({ error: "Invalid ID" });
    return;
  }

  const bodyParsed = ReplyToThreadBody.safeParse(req.body);
  if (!bodyParsed.success) {
    res.status(400).json({ error: bodyParsed.error.message });
    return;
  }

  const contentError = validateContent(bodyParsed.data.body, bodyParsed.data.photoUrl);
  if (contentError) {
    res.status(400).json({ error: contentError });
    return;
  }

  try {
    const [thread] = await db
      .select()
      .from(threads)
      .where(eq(threads.id, paramParsed.data.id));

    if (!thread) {
      res.status(404).json({ error: "Not found" });
      return;
    }

    const [message] = await db
      .insert(threadMessages)
      .values({
        threadId: thread.id,
        sender: "admin",
        body: bodyParsed.data.body,
        photoUrl: bodyParsed.data.photoUrl ?? null,
      })
      .returning();

    await db
      .update(threads)
      .set({
        unreadForCustomer: sql`${threads.unreadForCustomer} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(threads.id, thread.id));

    const replySnippet =
      bodyParsed.data.body.length > 320
        ? bodyParsed.data.body.slice(0, 317) + "..."
        : bodyParsed.data.body;
    const smsResult = await sendSms(
      thread.customerPhone,
      `Electrical Installers: ${replySnippet}${bodyParsed.data.photoUrl ? " [A photo was attached—open your website conversation to view it.]" : ""}`,
    );

    const [messageWithSmsStatus] = message
      ? await db
          .update(threadMessages)
          .set({
            smsMessageId: smsResult.messageId,
            smsStatus: smsResult.status,
            smsStatusUpdatedAt: new Date(),
          })
          .where(eq(threadMessages.id, message.id))
          .returning()
      : [];

    res.status(201).json(messageWithSmsStatus ? formatMessage(messageWithSmsStatus) : null);
  } catch (err) {
    next(err);
  }
});

export {
  publicRouter as threadsPublicRouter,
  adminRouter as threadsAdminRouter,
  webhookRouter as clickSendWebhookRouter,
};
