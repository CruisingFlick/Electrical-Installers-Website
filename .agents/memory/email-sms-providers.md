---
name: Email/SMS providers split
description: Which provider backs SMS vs transactional email, and why they are separate
---

Notifications use two different providers on purpose:
- **SMS** → ClickSend, `src/lib/clicksend.ts` (`sendSms`). Auth = Basic (CLICKSEND_USERNAME + CLICKSEND_API_KEY). AU phones auto-formatted to +61. Optional `CLICKSEND_SMS_FROM` (blank = shared number).
- **Email** → Resend, `src/lib/resend.ts` (`sendEmail`). Auth = Bearer RESEND_API_KEY. Direct `https://api.resend.com/emails` call. From header defaults to `Electrical Installers <BUSINESS_EMAIL>`, overridable via `EMAIL_FROM`.

**Why:** originally both were on ClickSend, but ClickSend has DISCONTINUED email sending for new customers (only Email-to-SMS remains, which is not what we want). So email was moved to Resend while SMS stayed on ClickSend. Do NOT try to reunify email onto ClickSend — it will never work on a new account.

**Gotchas:**
- Resend requires the sending DOMAIN (electricalinstallers.com.au) to be verified in the Resend dashboard (SPF/DKIM DNS). Until then real sends 403 with "domain is not verified"; only test sends to the account owner's own email are allowed.
- A Resend "Sending access" key returns 401 on GET /domains (read scope missing) but can still POST /emails — a 401 on /domains is NOT proof the key is bad.
- Email uses a direct RESEND_API_KEY secret (Bearer), NOT the Replit Resend connector. Rule: before trusting a pre-existing Replit connector, validate its stored key — an account-level "connected" connector can still hold an invalid/placeholder key or one scoped to a different project's domain.
- Both helpers are best-effort: no-op when their creds are missing; errors are logged, never thrown, so requests don't fail.

**How to apply:** when adding a new notification, import `sendSms` from `../lib/clicksend` and `sendEmail` from `../lib/resend` (two different modules).
