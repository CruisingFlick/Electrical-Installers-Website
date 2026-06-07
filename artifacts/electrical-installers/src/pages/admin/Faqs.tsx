import CmsManager, { type CmsConfig } from "./CmsManager";

const config: CmsConfig = {
  title: "FAQ",
  description: "Frequently asked questions shown on the public FAQ page.",
  adminPath: "/admin/faqs",
  newLabel: "FAQ",
  primaryField: "question",
  secondaryField: "answer",
  fields: [
    { name: "question", label: "Question", type: "text", required: true, placeholder: "Do you offer free quotes?" },
    { name: "answer", label: "Answer", type: "textarea", required: true, placeholder: "Yes — we provide free, no-obligation quotes…" },
    { name: "sortOrder", label: "Sort Order", type: "number", half: true, help: "lower shows first" },
  ],
};

export default function AdminFaqs() {
  return <CmsManager config={config} />;
}
