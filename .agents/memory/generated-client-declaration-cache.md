---
name: Generated client declaration cache
description: Prevents false frontend type errors after generated API contracts change.
---

After generated API client schemas change, rebuild the shared TypeScript project declarations before running artifact-only typechecks.

**Why:** Project references can resolve stale emitted declarations even when the generated source already contains the new field, producing misleading missing-property errors.

**How to apply:** Run the workspace shared-library typecheck/build first, then rerun the affected artifact typecheck.