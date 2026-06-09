---
name: Admin inquiry notifications
description: Where/how the business admin is alerted on new customer inquiries
---

Admin is notified on every customer-initiated inquiry via BOTH email (nodemailer → BUSINESS_EMAIL) and SMS (Twilio sendSms → ADMIN_PHONE).

Covered entrypoints (all public POST handlers):
- New message thread + chat-widget callback — `threads.ts` POST `/threads` (callback detected via `referenceType === "callback"`).
- Customer follow-up message in existing thread — `threads.ts` POST `/threads/:id/messages`.
- New booking — `bookings.ts` POST `/bookings`.
- New quote — `quotes.ts` POST `/quotes`.

**Why:** owner wanted phone alerts, not just email. SMS chosen over WhatsApp/web-push because Twilio was already fully configured (SID/token/number) and is most reliable; WhatsApp needs an extra approved Twilio sender.

**How to apply:** if you add a NEW customer-initiated entrypoint, mirror BOTH the email and `sendSms(ADMIN_PHONE, ...)` calls. Admin replies must NOT trigger admin SMS. SMS sends are fire-and-forget (`void sendSms`), errors swallowed inside `sendSms`, so they never break the request. `ADMIN_PHONE` constant in `lib/constants.ts` (env-overridable).
