import CmsManager, { type CmsConfig } from "./CmsManager";

const config: CmsConfig = {
  title: "Service Pages",
  description: "Detailed service pages at /services/{slug}.",
  adminPath: "/admin/service-pages",
  newLabel: "Service Page",
  primaryField: "title",
  secondaryField: "shortDescription",
  fields: [
    { name: "title", label: "Title", type: "text", required: true, placeholder: "Switchboard Upgrades" },
    { name: "slug", label: "Slug", type: "text", required: true, half: true, help: "URL path", placeholder: "switchboard-upgrades" },
    { name: "sortOrder", label: "Sort Order", type: "number", half: true, help: "lower shows first" },
    { name: "shortDescription", label: "Short Description", type: "textarea", required: true, help: "shown in listings", placeholder: "One or two sentences…" },
    { name: "fullDescription", label: "Full Description", type: "textarea", required: true, placeholder: "The full service description shown on the detail page…" },
    { name: "bullets", label: "Key Points", type: "list", required: true, help: "one per line", placeholder: "Compliant installation\nSafety switch protection" },
    { name: "pricingBlurb", label: "Pricing Note", type: "text", placeholder: "From $X — free quote on request" },
    { name: "portfolioCategory", label: "Portfolio Category", type: "text", half: true, help: "links related jobs", placeholder: "3-Phase Upgrade" },
    { name: "heroImageUrl", label: "Hero Image URL", type: "text", half: true, placeholder: "https://…" },
    { name: "externalPath", label: "External Path", type: "text", help: "optional override link, e.g. /underground-power", placeholder: "/underground-power" },
  ],
};

export default function AdminServicePages() {
  return <CmsManager config={config} />;
}
