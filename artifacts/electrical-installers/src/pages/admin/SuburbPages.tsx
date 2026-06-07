import CmsManager, { type CmsConfig } from "./CmsManager";

const config: CmsConfig = {
  title: "Suburb Pages",
  description: "Local landing pages at /{slug} (e.g. /mornington-electrician).",
  adminPath: "/admin/suburb-pages",
  newLabel: "Suburb Page",
  primaryField: "suburb",
  secondaryField: "heading",
  fields: [
    { name: "suburb", label: "Suburb", type: "text", required: true, half: true, placeholder: "Mornington" },
    { name: "slug", label: "Slug", type: "text", required: true, half: true, help: "URL path", placeholder: "mornington-electrician" },
    { name: "heading", label: "Page Heading", type: "text", required: true, placeholder: "Trusted Electricians in Mornington" },
    { name: "intro", label: "Intro Text", type: "textarea", required: true, placeholder: "Local, licensed electricians serving Mornington and surrounds…" },
    { name: "portfolioSuburb", label: "Portfolio Suburb", type: "text", half: true, help: "links local jobs", placeholder: "Mornington" },
    { name: "sortOrder", label: "Sort Order", type: "number", half: true, help: "lower shows first" },
  ],
};

export default function AdminSuburbPages() {
  return <CmsManager config={config} />;
}
