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
    if (!auth) return;
    const toFormatted = formatPhone(to);
    if (!toFormatted) return;

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

let cachedFromAddressId: number | null = null;

async function resolveFromAddressId(auth: string): Promise<number | null> {
  if (cachedFromAddressId !== null) return cachedFromAddressId;

  const explicit = process.env["CLICKSEND_EMAIL_ADDRESS_ID"];
  if (explicit && !Number.isNaN(Number(explicit))) {
    cachedFromAddressId = Number(explicit);
    return cachedFromAddressId;
  }

  const fromEmail = process.env["CLICKSEND_FROM_EMAIL"];
  if (!fromEmail) return null;

  try {
    const res = await fetch(`${CLICKSEND_BASE}/email/addresses`, {
      method: "GET",
      headers: { Authorization: auth },
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      logger.error({ status: res.status, body: text }, "ClickSend email/addresses lookup failed");
      return null;
    }
    const json = (await res.json()) as {
      data?: { data?: Array<{ email_address_id: number; email_address: string; verified?: number }> };
    };
    const addresses = json.data?.data ?? [];
    const match = addresses.find(
      (a) => a.email_address.toLowerCase() === fromEmail.toLowerCase()
    );
    if (!match) {
      logger.error(
        { fromEmail },
        "ClickSend from email not found among verified sending addresses"
      );
      return null;
    }
    cachedFromAddressId = match.email_address_id;
    return cachedFromAddressId;
  } catch (err) {
    logger.error({ err }, "Failed to resolve ClickSend from address id");
    return null;
  }
}

export interface EmailAttachment {
  content: string;
  filename: string;
  contentType: string;
}

export async function sendEmail(opts: {
  to: string;
  subject: string;
  html: string;
  text?: string;
  fromName?: string;
  attachments?: EmailAttachment[];
}): Promise<void> {
  try {
    const auth = getAuthHeader();
    if (!auth) return;

    const fromAddressId = await resolveFromAddressId(auth);
    if (fromAddressId === null) return;

    const payload: Record<string, unknown> = {
      to: [{ email: opts.to }],
      from: {
        email_address_id: fromAddressId,
        name: opts.fromName ?? "Electrical Installers",
      },
      subject: opts.subject,
      body: opts.html,
    };

    if (opts.attachments && opts.attachments.length > 0) {
      payload["attachments"] = opts.attachments.map((a) => ({
        content: Buffer.from(a.content, "utf-8").toString("base64"),
        type: a.contentType,
        filename: a.filename,
        disposition: "attachment",
      }));
    }

    const res = await fetch(`${CLICKSEND_BASE}/email/send`, {
      method: "POST",
      headers: {
        Authorization: auth,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    await checkResponse(res, "email send");
  } catch (err) {
    logger.error({ err }, "Failed to send email notification");
  }
}
