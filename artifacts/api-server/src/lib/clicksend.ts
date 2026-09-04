import { logger } from "./logger";

const CLICKSEND_BASE = "https://rest.clicksend.com/v3";

export type SmsDeliveryStatus = "sent" | "delivered" | "failed";

export type SmsSendResult = {
  messageId: string | null;
  status: SmsDeliveryStatus;
};

function normaliseStatus(status: string | null | undefined): SmsDeliveryStatus {
  const value = status?.trim().toUpperCase();
  if (value === "DELIVERED" || value === "COMPLETED") return "delivered";
  if (
    value &&
    (value.includes("FAIL") ||
      value.includes("INVALID") ||
      value.includes("REJECT") ||
      value.includes("EXPIRED") ||
      value.includes("UNDELIVER"))
  ) {
    return "failed";
  }
  return "sent";
}

function normaliseReceiptStatus(
  statusCode: string | number | null | undefined,
  statusText: string | null | undefined,
): SmsDeliveryStatus {
  const text = statusText?.trim().toUpperCase();
  if (
    String(statusCode) === "201" ||
    text?.includes("DELIVERED") ||
    text?.includes("RECEIVED ON HANDSET") ||
    text?.startsWith("SUCCESS")
  ) {
    return "delivered";
  }
  return normaliseStatus(text);
}

async function readResponse(
  res: Response,
  context: string,
): Promise<Record<string, unknown> | null> {
  const json = (await res.json().catch(() => null)) as Record<string, unknown> | null;
  if (!res.ok) {
    logger.error({ status: res.status, body: json }, `ClickSend ${context} failed`);
    return null;
  }
  // ClickSend can return HTTP 200 while embedding a non-success response_code.
  if (json && typeof json["response_code"] === "string" && json["response_code"] !== "SUCCESS") {
    logger.error(
      { responseCode: json["response_code"], responseMsg: json["response_msg"] },
      `ClickSend ${context} returned non-success response`
    );
    return null;
  }
  return json;
}

function getAuthHeader(): string | null {
  const username = process.env["CLICKSEND_USERNAME"];
  const apiKey = process.env["CLICKSEND_API_KEY"];
  if (!username || !apiKey) return null;
  return "Basic " + Buffer.from(`${username}:${apiKey}`).toString("base64");
}

function formatPhone(phone: string | null | undefined): string | null {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10 && digits.startsWith("0")) {
    return "+61" + digits.slice(1);
  }
  if (digits.length === 11 && digits.startsWith("61")) {
    return "+" + digits;
  }
  if (phone.trim().startsWith("+")) return phone.trim();
  return null;
}

export async function sendSms(
  to: string | null | undefined,
  body: string,
): Promise<SmsSendResult> {
  try {
    const auth = getAuthHeader();
    if (!auth) {
      logger.warn("SMS not sent: ClickSend credentials are not configured");
      return { messageId: null, status: "failed" };
    }
    const toFormatted = formatPhone(to);
    if (!toFormatted) {
      logger.warn({ phoneProvided: Boolean(to) }, "SMS not sent: invalid customer phone number");
      return { messageId: null, status: "failed" };
    }

    const from = process.env["CLICKSEND_SMS_FROM"];
    const message: Record<string, unknown> = {
      source: "nodejs",
      body,
      to: toFormatted,
    };
    if (from) message["from"] = from;

    const res = await fetch(`${CLICKSEND_BASE}/sms/send`, {
      method: "POST",
      headers: {
        Authorization: auth,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ messages: [message] }),
      signal: AbortSignal.timeout(10_000),
    });

    const json = await readResponse(res, "SMS send");
    if (!json) return { messageId: null, status: "failed" };

    const data = json["data"] as { messages?: Array<Record<string, unknown>> } | undefined;
    const sentMessage = data?.messages?.[0];
    const messageId =
      typeof sentMessage?.["message_id"] === "string"
        ? sentMessage["message_id"]
        : typeof sentMessage?.["message_id"] === "number"
          ? String(sentMessage["message_id"])
          : null;
    const providerStatus =
      typeof sentMessage?.["status"] === "string" ? sentMessage["status"] : undefined;
    return { messageId, status: normaliseStatus(providerStatus) };
  } catch (err) {
    logger.error({ err }, "Failed to send SMS notification");
    return { messageId: null, status: "failed" };
  }
}

export async function getSmsDeliveryStatus(
  messageId: string,
): Promise<SmsDeliveryStatus | null> {
  try {
    const auth = getAuthHeader();
    if (!auth) return null;

    const res = await fetch(`${CLICKSEND_BASE}/sms/receipts/${encodeURIComponent(messageId)}`, {
      headers: { Authorization: auth },
      signal: AbortSignal.timeout(5_000),
    });
    // ClickSend creates the receipt asynchronously, so a missing receipt is still pending.
    if (res.status === 404) return null;
    const json = await readResponse(res, "SMS status lookup");
    if (!json) return null;

    const data = json["data"] as Record<string, unknown> | undefined;
    const statusCode =
      typeof data?.["status_code"] === "string" || typeof data?.["status_code"] === "number"
        ? data["status_code"]
        : null;
    const statusText = typeof data?.["status_text"] === "string" ? data["status_text"] : null;
    return statusCode || statusText ? normaliseReceiptStatus(statusCode, statusText) : null;
  } catch (err) {
    logger.error({ err, messageId }, "Failed to check SMS delivery status");
    return null;
  }
}
