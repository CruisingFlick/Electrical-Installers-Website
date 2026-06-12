import { useEffect } from "react";

const BASE_URL = "https://electricalinstallers.com.au";
const DEFAULT_OG_IMAGE = `${BASE_URL}/logo.png`;

export interface PageMetaOptions {
  title: string;
  description: string;
  path?: string;
  ogImage?: string;
  ogType?: "website" | "article";
}

function setMeta(
  selector: string,
  attrType: "name" | "property",
  attrValue: string,
  content: string,
) {
  let el = document.querySelector(selector) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attrType, attrValue);
    document.head.appendChild(el);
  }
  el.content = content;
}

function setCanonical(href: string) {
  let el = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
  if (!el) {
    el = document.createElement("link");
    el.rel = "canonical";
    document.head.appendChild(el);
  }
  el.href = href;
}

export function usePageMeta({
  title,
  description,
  path,
  ogImage = DEFAULT_OG_IMAGE,
  ogType = "website",
}: PageMetaOptions) {
  useEffect(() => {
    document.title = title;

    const canonicalUrl = path
      ? `${BASE_URL}${path}`
      : window.location.href.replace(/[?#].*$/, "");

    setMeta('meta[name="description"]', "name", "description", description);

    setMeta('meta[property="og:title"]', "property", "og:title", title);
    setMeta('meta[property="og:description"]', "property", "og:description", description);
    setMeta('meta[property="og:url"]', "property", "og:url", canonicalUrl);
    setMeta('meta[property="og:image"]', "property", "og:image", ogImage);
    setMeta('meta[property="og:type"]', "property", "og:type", ogType);
    setMeta('meta[property="og:site_name"]', "property", "og:site_name", "Electrical Installers");

    setMeta('meta[name="twitter:card"]', "name", "twitter:card", "summary_large_image");
    setMeta('meta[name="twitter:title"]', "name", "twitter:title", title);
    setMeta('meta[name="twitter:description"]', "name", "twitter:description", description);
    setMeta('meta[name="twitter:image"]', "name", "twitter:image", ogImage);

    setCanonical(canonicalUrl);
  }, [title, description, path, ogImage, ogType]);
}
