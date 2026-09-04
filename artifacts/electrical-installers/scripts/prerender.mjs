#!/usr/bin/env node
// Static pre-rendering for the suburb ("electrician-<suburb>") landing pages.
//
// Why this exists: the site is a client-side-rendered React SPA with no
// server-side rendering. Every route's *raw* HTTP response is the same
// generic index.html shell — the real per-page content only appears after
// the JS bundle runs in a browser. Googlebot's first crawl pass only reads
// the raw response, so every suburb page looked identical/empty to it and
// got stuck as "Discovered - currently not indexed" in Search Console.
//
// This script runs after `vite build` and writes a real, fully-formed
// static index.html for each suburb route directly into the build output
// (dist/public/electrician-<slug>/index.html), with the correct <title>,
// <meta name="description"> and real page content already in the raw
// markup. The existing static hosting already serves "<path>/index.html"
// for a directory-style request (confirmed live: /electrician-dromana
// redirects to /electrician-dromana/), so this requires no server changes.
//
// The client bundle is untouched and still loads normally on these pages —
// React (see src/main.tsx, createRoot().render()) does a normal client
// render into #root once it loads, which fully re-renders on top of this
// markup. So this only needs to be good, real, crawlable HTML — it does
// not need to be a pixel-perfect hydration match.
//
// IMPORTANT: keep the markup below reasonably in sync with the JSX in
// src/pages/SuburbPage.tsx if that component's structure changes.

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Read the plain-JSON data file directly (no TS/bundler involved here —
// this script runs with plain `node` after the Vite build).
const SUBURBS = JSON.parse(
  readFileSync(path.join(__dirname, "..", "src", "data", "suburbs.json"), "utf-8"),
);
const SUBURBS_BY_SLUG = Object.fromEntries(SUBURBS.map((s) => [s.slug, s]));

const outDir = path.resolve(__dirname, "..", "dist", "public");
const shellPath = path.join(outDir, "index.html");

if (!existsSync(shellPath)) {
  console.error(
    `[prerender] Could not find built shell at ${shellPath}. Run "vite build" first.`,
  );
  process.exit(1);
}

const shellHtml = readFileSync(shellPath, "utf-8");

function escapeHtml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function renderSuburbBody(suburb) {
  const trustPoints = [
    { title: "Licensed &amp; insured", desc: "REC 25510 — fully compliant work" },
    { title: "Prompt &amp; reliable", desc: "On-time arrivals, tidy workmanship" },
    { title: "Locally trusted", desc: "Highly rated by local customers" },
  ];

  const servicesHtml = suburb.services
    .map(
      (s) => `
              <div class="flex items-center gap-3 bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-3">
                <span class="text-sm text-gray-700">${escapeHtml(s)}</span>
              </div>`,
    )
    .join("");

  const trustHtml = trustPoints
    .map(
      (p) => `
            <div class="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-start gap-3">
              <div>
                <p class="font-bold text-[hsl(214,60%,14%)] text-sm">${p.title}</p>
                <p class="text-xs text-gray-500 mt-0.5">${p.desc}</p>
              </div>
            </div>`,
    )
    .join("");

  const nearbyHtml = suburb.nearby
    .map((slug) => SUBURBS_BY_SLUG[slug])
    .filter(Boolean)
    .map(
      (n) => `
            <a href="/electrician-${n.slug}" class="text-sm bg-white border border-gray-100 shadow-sm text-[hsl(214,60%,14%)] px-4 py-2 rounded-full">Electrician ${n.name}</a>`,
    )
    .join("");

  return `
  <div>
    <div class="bg-[hsl(214,60%,14%)] text-white py-16">
      <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <p class="text-[hsl(25,95%,53%)] font-semibold text-sm uppercase tracking-wide mb-2">${escapeHtml(suburb.name)}</p>
        <h1 class="text-3xl sm:text-4xl font-bold mb-4">${escapeHtml(suburb.h1)}</h1>
        <p class="text-gray-300 text-lg max-w-2xl mb-6">Licensed Victorian electricians (REC 25510) serving ${escapeHtml(suburb.name)} and the surrounding Mornington Peninsula.</p>
        <a href="tel:0419868703" class="inline-flex items-center gap-2 bg-[hsl(25,95%,53%)] text-white font-bold px-5 py-3 rounded-full">Call 0419 868 703</a>
      </div>
    </div>
    <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <p class="text-gray-700 text-base leading-relaxed max-w-3xl">${escapeHtml(suburb.intro)}</p>
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-10">${trustHtml}
      </div>
      <div class="mt-14">
        <h2 class="text-2xl font-bold text-[hsl(214,60%,14%)] mb-6">Electrical services in ${escapeHtml(suburb.name)}</h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">${servicesHtml}
        </div>
        <a href="/services" class="inline-flex items-center gap-1.5 text-sm font-semibold text-[hsl(25,95%,53%)] mt-5">View all services</a>
      </div>
      <div class="mt-14">
        <h2 class="text-2xl font-bold text-[hsl(214,60%,14%)] mb-6">Nearby areas we cover</h2>
        <div class="flex flex-wrap gap-3">${nearbyHtml}
        </div>
      </div>
      <div class="mt-16 bg-[hsl(214,60%,14%)] rounded-2xl px-6 py-10 sm:px-10 text-center text-white">
        <h2 class="text-2xl font-bold mb-2">Need an electrician in ${escapeHtml(suburb.name)}?</h2>
        <p class="text-gray-300 mb-6 max-w-xl mx-auto">Get a free quote or book a job — we'd love to help. Fully licensed under REC 25510.</p>
        <div class="flex flex-col sm:flex-row items-center justify-center gap-3">
          <a href="/book" class="inline-flex items-center gap-2 bg-[hsl(25,95%,53%)] text-white font-bold px-6 py-3 rounded-full">Book an Electrician</a>
          <a href="tel:0419868703" class="inline-flex items-center gap-2 border border-white/30 text-white font-semibold px-6 py-3 rounded-full">Call 0419 868 703</a>
        </div>
      </div>
    </div>
  </div>`;
}

function buildPageHtml(suburb) {
  let html = shellHtml;

  // Swap <title>
  html = html.replace(
    /<title>[^<]*<\/title>/,
    `<title>${escapeHtml(suburb.title)}</title>`,
  );

  // Swap <meta name="description" content="...">
  html = html.replace(
    /<meta name="description" content="[^"]*"\s*\/>/,
    `<meta name="description" content="${escapeHtml(suburb.metaDescription)}" />`,
  );

  // Inject real content into #root so the raw HTML isn't empty. The client
  // bundle replaces this with a normal client render once it loads.
  html = html.replace(
    '<div id="root"></div>',
    `<div id="root">${renderSuburbBody(suburb)}</div>`,
  );

  return html;
}

let written = 0;
for (const suburb of SUBURBS) {
  const html = buildPageHtml(suburb);

  // Directory-style output (electrician-dromana/index.html) — this is what
  // the production host serves for the canonical /electrician-dromana/
  // URL (confirmed live: requesting the path without a trailing slash
  // 301-redirects to the slash version, which resolves to this file).
  const dir = path.join(outDir, `electrician-${suburb.slug}`);
  mkdirSync(dir, { recursive: true });
  const dirFilePath = path.join(dir, "index.html");
  writeFileSync(dirFilePath, html, "utf-8");

  // Also write a flat "electrician-dromana.html" alongside it. Belt and
  // braces: if the host ever serves the no-trailing-slash URL directly
  // instead of redirecting (this differs between static hosts, and we
  // can only verify the live host's exact behaviour empirically), this
  // covers that case too instead of silently falling back to the generic
  // shell for whichever exact URL Googlebot requests.
  const flatFilePath = path.join(outDir, `electrician-${suburb.slug}.html`);
  writeFileSync(flatFilePath, html, "utf-8");

  written += 1;
  console.log(
    `[prerender] wrote ${path.relative(outDir, dirFilePath)} and ${path.relative(outDir, flatFilePath)}`,
  );
}

console.log(`[prerender] done — ${written} suburb pages pre-rendered.`);
