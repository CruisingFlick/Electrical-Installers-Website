import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import request from "supertest";
import { eq, inArray } from "drizzle-orm";
import app from "../app";
import { db, threads, threadMessages } from "@workspace/db";

const createdThreadIds: number[] = [];

async function createThread() {
  const res = await request(app)
    .post("/api/threads")
    .send({
      customerName: "Vitest Customer",
      customerPhone: "0400000000",
      message: "Hello from the test suite",
    });
  if (res.body?.id) createdThreadIds.push(res.body.id);
  return res;
}

let adminAgent: ReturnType<typeof request.agent>;

beforeAll(async () => {
  adminAgent = request.agent(app);
  const login = await adminAgent
    .post("/api/admin/login")
    .send({ password: process.env["ADMIN_PASSWORD"] });
  expect(login.status).toBe(200);
});

afterAll(async () => {
  if (createdThreadIds.length > 0) {
    await db
      .delete(threadMessages)
      .where(inArray(threadMessages.threadId, createdThreadIds));
    await db.delete(threads).where(inArray(threads.id, createdThreadIds));
  }
});

describe("thread creation", () => {
  it("returns the access token exactly once, on create", async () => {
    const res = await createThread();
    expect(res.status).toBe(201);
    expect(typeof res.body.accessToken).toBe("string");
    expect(res.body.accessToken.length).toBeGreaterThan(10);
    expect(res.body.messages).toHaveLength(1);
    expect(res.body.messages[0].sender).toBe("customer");
  });
});

describe("public thread access (IDOR protection)", () => {
  let id: number;
  let token: string;

  beforeAll(async () => {
    const res = await createThread();
    id = res.body.id;
    token = res.body.accessToken;
  });

  it("allows reading with the correct token", async () => {
    const res = await request(app).get(`/api/threads/${id}`).query({ token });
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(id);
  });

  it("never leaks the access token on read", async () => {
    const res = await request(app).get(`/api/threads/${id}`).query({ token });
    expect(res.status).toBe(200);
    expect(res.body.accessToken).toBeUndefined();
  });

  it("returns 404 with a wrong token", async () => {
    const res = await request(app)
      .get(`/api/threads/${id}`)
      .query({ token: "not-the-real-token" });
    expect(res.status).toBe(404);
  });

  it("rejects reading with no token", async () => {
    const res = await request(app).get(`/api/threads/${id}`);
    expect(res.status).toBe(404);
  });

  it("returns 404 for a wrong id with a valid-looking token", async () => {
    const res = await request(app)
      .get(`/api/threads/${id + 999999}`)
      .query({ token });
    expect(res.status).toBe(404);
  });

  it("accepts a customer message with the correct token", async () => {
    const res = await request(app)
      .post(`/api/threads/${id}/messages`)
      .query({ token })
      .send({ body: "A follow-up message" });
    expect(res.status).toBe(201);
    expect(res.body.sender).toBe("customer");
  });

  it("rejects posting a message with a wrong token", async () => {
    const res = await request(app)
      .post(`/api/threads/${id}/messages`)
      .query({ token: "wrong" })
      .send({ body: "Should not be inserted" });
    expect(res.status).toBe(404);
  });
});

describe("content validation", () => {
  let id: number;
  let token: string;

  beforeAll(async () => {
    const res = await createThread();
    id = res.body.id;
    token = res.body.accessToken;
  });

  it("rejects an over-long message body", async () => {
    const res = await request(app)
      .post(`/api/threads/${id}/messages`)
      .query({ token })
      .send({ body: "x".repeat(5001) });
    expect(res.status).toBe(400);
  });

  it("rejects a non-image photo data URL", async () => {
    const res = await request(app)
      .post(`/api/threads/${id}/messages`)
      .query({ token })
      .send({ body: "see attachment", photoUrl: "data:text/html;base64,AAAA" });
    expect(res.status).toBe(400);
  });
});

describe("admin thread access", () => {
  let id: number;

  beforeAll(async () => {
    const res = await createThread();
    id = res.body.id;
  });

  it("rejects unauthenticated admin detail access", async () => {
    const res = await request(app).get(`/api/admin/threads/${id}`);
    expect(res.status).toBe(401);
  });

  it("rejects unauthenticated admin list access", async () => {
    const res = await request(app).get(`/api/admin/threads`);
    expect(res.status).toBe(401);
  });

  it("allows authenticated admin detail access without leaking the token", async () => {
    const res = await adminAgent.get(`/api/admin/threads/${id}`);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(id);
    expect(res.body.accessToken).toBeUndefined();
  });

  it("does not leak any token in the admin list", async () => {
    const res = await adminAgent.get(`/api/admin/threads`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    for (const t of res.body) {
      expect(t.accessToken).toBeUndefined();
    }
  });

  it("does not reset unread counters on admin read", async () => {
    const before = await adminAgent.get(`/api/admin/threads/${id}`);
    const unreadBefore = before.body.unreadForAdmin;
    const after = await adminAgent.get(`/api/admin/threads/${id}`);
    expect(after.body.unreadForAdmin).toBe(unreadBefore);
  });

  it("reads a recently pending SMS from the database without checking ClickSend", async () => {
    const messageId = `vitest-recent-sms-${id}`;
    await db.insert(threadMessages).values({
      threadId: id,
      sender: "admin",
      body: "Recently sent SMS",
      smsMessageId: messageId,
      smsStatus: "sent",
      smsStatusUpdatedAt: new Date(),
    });
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    try {
      const response = await adminAgent.get(`/api/admin/threads/${id}`);
      expect(response.status).toBe(200);
      expect(
        response.body.messages.find(
          (message: { smsMessageId?: string }) => message.smsMessageId === messageId,
        )?.smsStatus,
      ).toBe("sent");
      expect(fetchMock).not.toHaveBeenCalled();
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it("uses one bounded ClickSend lookup as a fallback for a stale pending SMS", async () => {
    const messageId = `vitest-stale-sms-${id}`;
    await db.insert(threadMessages).values({
      threadId: id,
      sender: "admin",
      body: "Stale pending SMS",
      smsMessageId: messageId,
      smsStatus: "sent",
      smsStatusUpdatedAt: new Date(Date.now() - 10 * 60 * 1000),
    });
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          response_code: "SUCCESS",
          data: {
            message_id: messageId,
            status_code: "201",
            status_text: "Success: Message received on handset.",
          },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);
    try {
      const response = await adminAgent.get(`/api/admin/threads/${id}`);
      expect(response.status).toBe(200);
      expect(
        response.body.messages.find(
          (message: { smsMessageId?: string }) => message.smsMessageId === messageId,
        )?.smsStatus,
      ).toBe("delivered");
      expect(fetchMock).toHaveBeenCalledTimes(1);

      await adminAgent.get(`/api/admin/threads/${id}`);
      expect(fetchMock).toHaveBeenCalledTimes(1);
    } finally {
      vi.unstubAllGlobals();
    }
  });
});

describe("ClickSend delivery receipts", () => {
  it("updates a pending SMS once and safely accepts duplicate receipts", async () => {
    const threadResponse = await createThread();
    const threadId = threadResponse.body.id as number;
    const messageId = `vitest-sms-${threadId}`;
    const [message] = await db
      .insert(threadMessages)
      .values({
        threadId,
        sender: "admin",
        body: "Delivery receipt test",
        smsMessageId: messageId,
        smsStatus: "sent",
        smsStatusUpdatedAt: new Date(),
      })
      .returning();
    expect(message).toBeDefined();

    const previousSecret = process.env["CLICKSEND_WEBHOOK_SECRET"];
    process.env["CLICKSEND_WEBHOOK_SECRET"] = "vitest-webhook-secret";
    try {
      const sendReceipt = (statusCode: string, statusText: string) =>
        request(app)
          .post("/api/webhooks/clicksend/sms-receipts")
          .set("x-clicksend-webhook-token", "vitest-webhook-secret")
          .send({
            message_id: messageId,
            status_code: statusCode,
            status_text: statusText,
          });

      expect((await sendReceipt("200", "Message queued for delivery")).status).toBe(200);
      const [queued] = await db
        .select()
        .from(threadMessages)
        .where(eq(threadMessages.id, message!.id));
      expect(queued?.smsStatus).toBe("sent");

      expect(
        (await sendReceipt("201", "Success: Message received on handset.")).status,
      ).toBe(200);
      const [delivered] = await db
        .select()
        .from(threadMessages)
        .where(eq(threadMessages.id, message!.id));
      expect(delivered?.smsStatus).toBe("delivered");
      const updatedAt = delivered?.smsStatusUpdatedAt?.getTime();

      expect(
        (await sendReceipt("201", "Success: Message received on handset.")).status,
      ).toBe(200);
      const [afterDuplicate] = await db
        .select()
        .from(threadMessages)
        .where(eq(threadMessages.id, message!.id));
      expect(afterDuplicate?.smsStatus).toBe("delivered");
      expect(afterDuplicate?.smsStatusUpdatedAt?.getTime()).toBe(updatedAt);
    } finally {
      if (previousSecret === undefined) delete process.env["CLICKSEND_WEBHOOK_SECRET"];
      else process.env["CLICKSEND_WEBHOOK_SECRET"] = previousSecret;
    }
  });

  it("rejects an unverified receipt", async () => {
    const previousSecret = process.env["CLICKSEND_WEBHOOK_SECRET"];
    process.env["CLICKSEND_WEBHOOK_SECRET"] = "vitest-webhook-secret";
    try {
      const response = await request(app)
        .post("/api/webhooks/clicksend/sms-receipts")
        .send({ message_id: "unknown", status_code: "201" });
      expect(response.status).toBe(401);
    } finally {
      if (previousSecret === undefined) delete process.env["CLICKSEND_WEBHOOK_SECRET"];
      else process.env["CLICKSEND_WEBHOOK_SECRET"] = previousSecret;
    }
  });
});
