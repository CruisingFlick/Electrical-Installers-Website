---
name: Vite manualChunks React circular-chunk crash
description: Why splitting react into its own manualChunk while scheduler lands in vendor breaks the minified prod build (dev is fine).
---

# Vite manualChunks: keep react + react-dom + scheduler together

When `build.rollupOptions.output.manualChunks` puts `react`/`react-dom` in a
dedicated chunk, you MUST also put `node_modules/scheduler/` in that same chunk.

**Symptom:** production (built/minified) site renders only static content and
never mounts. With the SEO prerender injecting fallback HTML into `#root`, the
fallback stays visible because React throws during its first render phase, so
`createRoot().render()` never commits / clears `#root`. Browser console shows:
`TypeError: Cannot set properties of undefined (setting 'Children')` originating
in the react chunk, called from the vendor chunk. Dev works fine (Vite serves
unbundled, no manualChunks).

**Why:** `react-dom` depends on `scheduler`. If `scheduler` falls into the
generic `vendor` chunk (everything else in `node_modules/`), and `vendor` also
contains libraries that import `react`, you get a circular chunk dependency:
react chunk → vendor chunk (scheduler) → react chunk. Under minification the
CJS↔ESM interop init order is wrong, so React's exports object is undefined when
`Children` is assigned.

**How to apply:** in the manualChunks function, the react condition must be
`id.includes("node_modules/react/") || id.includes("node_modules/react-dom/") || id.includes("node_modules/scheduler/")`.
`react/jsx-runtime` and `react-dom/client` are already covered by the react/
react-dom prefixes. `use-sync-external-store` can stay in vendor (one-way dep).
The goal: the react chunk must be a dependency ROOT (vendor→react only, never
react→vendor).

**Repro/verify without a browser:** build the prod bundle, then load the built
entry chunk in a jsdom harness (set window/document/navigator/matchMedia/fetch
globals, create `#root`, `await import(entryFileUrl)`); the import throws the
exact error pre-fix and mounts (clears `#root`) post-fix. jsdom is not a repo
dep — add `-w -D` temporarily and remove after.
