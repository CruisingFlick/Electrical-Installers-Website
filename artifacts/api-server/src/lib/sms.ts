import twilio from "twilio";
import { logger } from "./logger";

function getClient() {
  const sid = process.env["TWILIO_ACCOUNT_SID"];
  const token = process.env["TWILIO_AUTH_TOKEN"];
  if (!sid || !token) return null;
  return twilio(sid, token);
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
  if (digits.startsWith("+")) return phone;
  return null;
}

export async function sendSms(to: string | null | undefined, body: string): Promise<void> {
  try {
    const client = getClient();
    if (!client) return;
    const from = process.env["TWILIO_PHONE_NUMBER"];
    if (!from) return;
    const toFormatted = formatPhone(to);
    if (!toFormatted) return;
    await client.messages.create({ body, from, to: toFormatted });
  } catch (err) {
    logger.error({ err }, "Failed to send SMS notification");
  }
}
