import suburbsData from "./suburbs.json";

export interface SuburbData {
  slug: string;
  name: string;
  title: string;
  metaDescription: string;
  h1: string;
  intro: string;
  services: string[];
  nearby: string[]; // slugs of nearby suburbs
}

// Data lives in suburbs.json (not inline here) so it can be read by both
// this typed module (for the app) and scripts/prerender.mjs (a plain Node
// script, no TypeScript/bundler involved) without duplicating content.
export const SUBURBS: SuburbData[] = suburbsData as SuburbData[];

export const SUBURBS_BY_SLUG: Record<string, SuburbData> = Object.fromEntries(
  SUBURBS.map((s) => [s.slug, s]),
);
