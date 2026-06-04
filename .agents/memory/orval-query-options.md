---
name: Orval query hook options
description: Generated hooks require queryKey in the query options object; enabled alone causes TS2741.
---

When passing `query` options to Orval-generated hooks (e.g. `useGetBlogPost`), TypeScript requires `queryKey` alongside any other options like `enabled`. Import the matching `get*QueryKey` helper and include it.

**Why:** The generated `UseQueryOptions` type marks `queryKey` as required. Passing only `{ enabled: boolean }` triggers TS2741.

**How to apply:**
```ts
import { useGetBlogPost, getGetBlogPostQueryKey } from "@workspace/api-client-react";
useGetBlogPost(slug, { query: { queryKey: getGetBlogPostQueryKey(slug), enabled: !!slug } });
```
