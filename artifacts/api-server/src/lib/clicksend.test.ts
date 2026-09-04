import { afterEach, describe, expect, it, vi } from "vitest";
import {
  getSmsDeliveryStatus,
  parseSmsDeliveryReceipt,
  sendSms,
  verifyClickSendWebhookToken,
} from "./clicksend";

const originalUsername = process.env["CLICKSEND_USERNAME"];
const originalApiKey = process.env["CLICKSEND_API_KEY"];
const originalWebhookSecret = process.env["CLICKSEND_WEBHOOK_SECRET"];

afterEach(() => {
  vi.unstubAllGlobals();
  if (originalUsername === undefined) delete process.env["CLICKSEND_USERNAME"];
  else process.env["CLICKSEND_USERNAME"] = originalUsername;
  if (originalApiKey === undefined) delete process.env["CLICKSEND_API_KEY"];
  else process.env["CLICKSEND_API_KEY"] = originalApiKey;
  if (originalWebhookSecret === undefined) delete process.env["CLICKSEND_WEBHOOK_SECRET"];
  else process.env["CLICKSEND_WEBHOOK_SECRET"] = originalWebhookSecret;
});

describe("delivery receipt webhooks", () => {
  it("parses ClickSend's receipt payload", () => {
    expect(
      parseSmsDeliveryReceipt({
        message_id: "message-123",
        status_code: "201",
        status_text: "Success: Message received on handset.",
      }),
    ).toEqual({ messageId: "message-123", status: "delivered" });
  });

  it("maps failure receipts and nested test payloads", () => {
    expect(
      parseSmsDeliveryReceipt({
        data: {
          message_id: "message-456",
          status_code: "301",
          status_text: "Failed: Invalid recipient",
        },
      }),
    ).toEqual({ messageId: "message-456", status: "failed" });
  });

  it("treats non-delivery gateway codes as failed even without descriptive text", () => {
    expect(
      parseSmsDeliveryReceipt({
        message_id: "message-789",
        status_code: "301",
        status_text: "Unknown gateway response",
      }),
    ).toEqual({ messageId: "message-789", status: "failed" });
  });

  it("keeps a queued receipt pending so a later delivery can supersede it", () => {
    expect(
      parseSmsDeliveryReceipt({
        message_id: "message-queued",
        status_code: "200",
        status_text: "Message queued for delivery",
      }),
    ).toEqual({ messageId: "message-queued", status: "sent" });
  });

  it("rejects malformed receipts", () => {
    expect(parseSmsDeliveryReceipt({ status_code: "201" })).toBeNull();
  });

  it("verifies the configured webhook secret", () => {
    process.env["CLICKSEND_WEBHOOK_SECRET"] = "receipt-secret";
    expect(verifyClickSendWebhookToken("receipt-secret")).toBe(true);
    expect(verifyClickSendWebhookToken("wrong-secret")).toBe(false);
  });
});

function configureCredentials() {
  process.env["CLICKSEND_USERNAME"] = "test-user";
  process.env["CLICKSEND_API_KEY"] = "test-key";
}

describe("sendSms", () => {
  it("returns the ClickSend message ID and initial sent status", async () => {
    configureCredentials();
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          response_code: "SUCCESS",
          data: {
            messages: [{ message_id: "message-123", status: "SUCCESS" }],
          },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(sendSms("0400 000 000", "Hello")).resolves.toEqual({
      messageId: "message-123",
      status: "sent",
    });
  });

  it("returns failed without discarding the website reply when ClickSend rejects it", async () => {
    configureCredentials();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({ response_code: "INVALID_RECIPIENT", response_msg: "Invalid number" }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
      ),
    );

    await expect(sendSms("0400 000 000", "Hello")).resolves.toEqual({
      messageId: null,
      status: "failed",
    });
  });
});

describe("getSmsDeliveryStatus", () => {
  it("maps a handset receipt to delivered", async () => {
    configureCredentials();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            response_code: "SUCCESS",
            data: {
              message_id: "message-123",
              status_code: "201",
              status_text: "Success: Message received on handset.",
            },
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
      ),
    );

    await expect(getSmsDeliveryStatus("message-123")).resolves.toBe("delivered");
  });

  it("leaves the message pending while ClickSend has not created a receipt", async () => {
    configureCredentials();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 404 })));

    await expect(getSmsDeliveryStatus("message-123")).resolves.toBeNull();
  });
});