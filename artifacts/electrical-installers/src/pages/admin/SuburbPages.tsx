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
    { name: "servicesCopy", label: "Services Copy", type: "textarea", help: "Suburb-specific services paragraph (replaces generic list when filled in)", placeholder: "We handle everything from switchboard upgrades in older Mornington homes to new lighting in local renovations…" },
    { name: "recentProjects", label: "Recent Projects", type: "textarea", help: "Recent work completed in this suburb", placeholder: "Recent jobs include a switchboard upgrade in Central Mornington, EV charger in Bungower Road…" },
    { name: "localTestimonial", label: "Local Testimonial", type: "textarea", help: "A quote from a local customer", placeholder: "Fantastic service — came out the same day and fixed our power issue quickly." },
    { name: "localTestimonialAuthor", label: "Testimonial Author", type: "text", half: true, placeholder: "Sarah T., Mornington" },
    { name: "nearbyAreas", label: "Nearby Areas", type: "text", help: "Comma-separated neighbouring suburbs we also serve", placeholder: "Mount Martha, Moorooduc, Safety Beach" },
    { name: "localFaqs", label: "Local FAQs", type: "textarea", help: 'FAQ pairs — one per block: "Q: question\\nA: answer" (blank line between each)', placeholder: "Q: Do you cover all of Mornington?\nA: Yes, we cover all streets and estates in Mornington and surrounds.\n\nQ: How quickly can you attend an emergency callout?\nA: We aim to reach most Mornington addresses within the hour." },
    { name: "portfolioSuburb", label: "Portfolio Suburb", type: "text", half: true, help: "links local jobs", placeholder: "Mornington" },
    { name: "sortOrder", label: "Sort Order", type: "number", half: true, help: "lower shows first" },
  ],
};

export default function AdminSuburbPages() {
  return <CmsManager config={config} />;
}
