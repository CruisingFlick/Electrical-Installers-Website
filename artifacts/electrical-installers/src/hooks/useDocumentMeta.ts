import { useEffect } from "react";

/**
 * Sets document.title and the <meta name="description"> tag for the
 * lifetime of the mounted component, then restores the previous values
 * on unmount. Needed because this app has no server-side rendering /
 * per-route <head> handling — pages that want a unique title/description
 * (distinct from the generic index.html defaults) call this on mount.
 *
 * Note: this only affects the client-rendered DOM after hydration. The
 * *raw* HTML served for each route still needs to carry the correct
 * title/description independently — see scripts/prerender.mjs, which
 * bakes this same data into a static index.html per route at build time
 * so crawlers see it before any JS runs.
 */
export function useDocumentMeta(title: string, description: string) {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = title;

    const meta = document.querySelector('meta[name="description"]');
    const previousDescription = meta?.getAttribute("content") ?? "";
    if (meta) {
      meta.setAttribute("content", description);
    }

    return () => {
      document.title = previousTitle;
      if (meta) {
        meta.setAttribute("content", previousDescription);
      }
    };
  }, [title, description]);
}
