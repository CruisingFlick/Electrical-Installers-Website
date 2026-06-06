---
name: Thread access-token (customer messaging IDOR)
description: How public customer↔admin message threads are protected against IDOR, and why the create response uses a separate schema.
---

# Thread access-token pattern

Public message threads (`threads` table) are keyed by a sequential numeric `id`, which alone is guessable. To prevent IDOR, each thread has an `accessToken` (UUID, server-generated).

- Public `GET /threads/:id` and `POST /threads/:id/messages` require a matching `?token=` query param; mismatch returns **404** (not 403, to avoid confirming existence).
- The token must only ever leave the server in the **create** response, so the customer can persist it in `localStorage`. Every other response must omit it.

**Why a separate `CreatedThread` OpenAPI schema:** the create (201) response needs `accessToken` as a required field, but all GET responses (public `GET /threads/:id`, admin `GET /admin/threads/:id`, admin list, PATCH) must NOT include it. Keeping one shared `ThreadWithMessages` schema with `accessToken` required leaked the token to admin/public reads; making it optional broke the frontend's create handler (which needs a non-optional string). Solution: `CreatedThread` (token required) for create only; `ThreadWithMessages` (no token) for every read.

**How to apply:** in routes, `formatThread()` includes the token (create only); `formatThreadList()` strips it (all GET/list/PATCH). If you add any new thread-returning endpoint, default to `formatThreadList` unless it is the initial create bootstrap.
