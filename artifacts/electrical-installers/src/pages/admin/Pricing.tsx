import CmsManager, { type CmsConfig } from "./CmsManager";

const config: CmsConfig = {
  title: "Pricing Guide",
  description: "Indicative price ranges shown on the public Pricing page.",
  adminPath: "/admin/pricing",
  newLabel: "Price Item",
  primaryField: "label",
  secondaryField: "priceRange",
  fields: [
    { name: "label", label: "Service / Item", type: "text", required: true, placeholder: "Power point installation" },
    { name: "priceRange", label: "Price Range", type: "text", required: true, placeholder: "$120 – $220" },
    { name: "description", label: "Description", type: "textarea", placeholder: "Supply and install a new double power point…" },
    { name: "sortOrder", label: "Sort Order", type: "number", half: true, help: "lower shows first" },
  ],
};

export default function AdminPricing() {
  return <CmsManager config={config} />;
}
