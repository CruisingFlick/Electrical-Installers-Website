import { logger } from "./logger";
import { BUSINESS_EMAIL } from "./constants";

// Transactional email via Resend (https://resend.com).
// ClickSend discontinued email sending for new customers, so email moved to
// Resend while SMS stays on ClickSend (see ./clicksend.ts).
// Best-effort: no-ops when RESEND_API_KEY is not configured.
const RESEND_ENDPOINT = "https://api.resend.com/emails";

export interface EmailAttachment {
  content: string;
  filename: string;
  contentType: string;
}

function resolveFrom(fromName?: string): string {
  const configured = process.env["EMAIL_FROM"];
  if (configured) return configured;
  const name = fromName ?? "Electrical Installers";
  return `${name} <${BUSINESS_EMAIL}>`;
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
    const apiKey = process.env["RESEND_API_KEY"];
    if (!apiKey) return;

    const payload: Record<string, unknown> = {
      from: resolveFrom(opts.fromName),
      to: [opts.to],
      subject: opts.subject,
      html: opts.html,
    };
    if (opts.text) payload["text"] = opts.text;

    if (opts.attachments && opts.attachments.length > 0) {
      payload["attachments"] = opts.attachments.map((a) => ({
        filename: a.filename,
        content: Buffer.from(a.content, "utf-8").toString("base64"),
        contentType: a.contentType,
      }));
    }

    const res = await fetch(RESEND_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      logger.error({ status: res.status, body }, "Resend email send failed");
    }
  } catch (err) {
    logger.error({ err }, "Failed to send email notification");
  }
}
