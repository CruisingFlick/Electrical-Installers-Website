import { afterEach, describe, expect, it, vi } from "vitest";
import { getSmsDeliveryStatus, sendSms } from "./clicksend";

const originalUsername = process.env["CLICKSEND_USERNAME"];
const originalApiKey = process.env["CLICKSEND_API_KEY"];

afterEach(() => {
  vi.unstubAllGlobals();
  if (originalUsername === undefined) delete process.env["CLICKSEND_USERNAME"];
  else process.env["CLICKSEND_USERNAME"] = originalUsername;
  if (originalApiKey === undefined) delete process.env["CLICKSEND_API_KEY"];
  else process.env["CLICKSEND_API_KEY"] = originalApiKey;
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