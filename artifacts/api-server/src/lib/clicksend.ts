import { logger } from "./logger";

const CLICKSEND_BASE = "https://rest.clicksend.com/v3";

async function checkResponse(res: Response, context: string): Promise<void> {
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    logger.error({ status: res.status, body: text }, `ClickSend ${context} failed`);
    return;
  }
  // ClickSend can return HTTP 200 while embedding a non-success response_code.
  const json = (await res.json().catch(() => null)) as
    | { response_code?: string; response_msg?: string }
    | null;
  if (json && json.response_code && json.response_code !== "SUCCESS") {
    logger.error(
      { responseCode: json.response_code, responseMsg: json.response_msg },
      `ClickSend ${context} returned non-success response`
    );
  }
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

export async function sendSms(to: string | null | undefined, body: string): Promise<void> {
  try {
    const auth = getAuthHeader();
    if (!auth) {
      logger.warn("SMS not sent: ClickSend credentials are not configured");
      return;
    }
    const toFormatted = formatPhone(to);
    if (!toFormatted) {
      logger.warn({ phoneProvided: Boolean(to) }, "SMS not sent: invalid customer phone number");
      return;
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
    });

    await checkResponse(res, "SMS send");
  } catch (err) {
    logger.error({ err }, "Failed to send SMS notification");
  }
}
