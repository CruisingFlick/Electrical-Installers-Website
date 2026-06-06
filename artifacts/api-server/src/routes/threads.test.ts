import { describe, it, expect, beforeAll, afterAll } from "vitest";
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
});
