import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "wouter";
import { MapPin, Phone, Check, Shield, Clock, Star, Quote, ChevronDown, ChevronUp } from "lucide-react";
import { apiGet, type SuburbPage } from "@/lib/cms";
import NotFound from "@/pages/not-found";
import { useJsonLd } from "@/hooks/useJsonLd";
import { usePageMeta } from "@/hooks/usePageMeta";

const HIGHLIGHTS = [
  { icon: Shield, label: "Licensed & insured", desc: "REC 25510 — fully compliant work" },
  { icon: Clock, label: "Prompt & reliable", desc: "On-time arrivals, tidy workmanship" },
  { icon: Star, label: "Locally trusted", desc: "Highly rated by local customers" },
];

const DEFAULT_SERVICES = [
  "New homes & renovations",
  "Switchboard upgrades",
  "Power points & lighting",
  "Safety inspections",
  "3-phase upgrades",
  "Underground power",
];

function parseLocalFaqs(text: string): { q: string; a: string }[] {
  const faqs: { q: string; a: string }[] = [];
  const blocks = text.split(/\n\n+/);
  for (const block of blocks) {
    const lines = block.split("\n");
    const qLine = lines.find((l) => l.startsWith("Q:"));
    const aLine = lines.find((l) => l.startsWith("A:"));
    if (qLine && aLine) {
      faqs.push({ q: qLine.slice(2).trim(), a: aLine.slice(2).trim() });
    }
  }
  return faqs;
}

function FaqAccordion({ faqs }: { faqs: { q: string; a: string }[] }) {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <div className="divide-y divide-gray-100 rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden">
      {faqs.map((faq, i) => (
        <div key={i}>
          <button
            className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left hover:bg-gray-50 transition-colors"
            onClick={() => setOpen(open === i ? null : i)}
            aria-expanded={open === i}
          >
            <span className="font-semibold text-sm text-[hsl(214,60%,14%)]">{faq.q}</span>
            {open === i ? (
              <ChevronUp size={16} className="text-gray-400 shrink-0" />
            ) : (
              <ChevronDown size={16} className="text-gray-400 shrink-0" />
            )}
          </button>
          {open === i && (
            <div className="px-5 pb-4 text-sm text-gray-600 leading-relaxed">{faq.a}</div>
          )}
        </div>
      ))}
    </div>
  );
}

export default function SuburbDetailPage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug ?? "";
  const { data: page, isLoading, error } = useQuery({
    queryKey: ["suburb-page", slug],
    queryFn: () => apiGet<SuburbPage>(`/suburb-pages/${slug}`),
    enabled: !!slug,
    retry: false,
  });

  usePageMeta({
    title: page ? `${page.heading} | Electrical Installers` : "Local Electricians | Electrical Installers",
    description: page ? (page.intro.length > 160 ? page.intro.slice(0, 157) + "..." : page.intro) : "Licensed electricians serving your area. Residential and commercial electrical work.",
    path: `/${slug}`,
  });

  const pageUrl = `https://www.electricalinstallers.com.au/${slug}`;

  const localFaqs = page?.localFaqs ? parseLocalFaqs(page.localFaqs) : [];

  useJsonLd(page ? {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Service",
        "name": page.heading,
        "description": page.intro,
        "areaServed": { "@type": "Place", "name": page.suburb },
        "url": pageUrl,
        "mainEntityOfPage": { "@type": "WebPage", "@id": pageUrl },
        "provider": {
          "@type": "LocalBusiness",
          "@id": "https://www.electricalinstallers.com.au/#business",
          "name": "Electrical Installers",
          "url": "https://www.electricalinstallers.com.au",
        },
      },
      ...(localFaqs.length > 0 ? [{
        "@type": "FAQPage",
        "mainEntity": localFaqs.map((f) => ({
          "@type": "Question",
          "name": f.q,
          "acceptedAnswer": { "@type": "Answer", "text": f.a },
        })),
      }] : []),
    ],
  } : null);

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="space-y-4 animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-3/4" />
          <div className="h-4 bg-gray-100 rounded w-1/2" />
          <div className="h-40 bg-gray-100 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (error || !page) {
    return <NotFound />;
  }

  const nearbyAreaList = page.nearbyAreas
    ? page.nearbyAreas.split(",").map((s) => s.trim()).filter(Boolean)
    : [];

  return (
    <div>
      <div className="bg-[hsl(214,60%,14%)] text-white py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 text-[hsl(25,95%,63%)] font-semibold mb-3">
            <MapPin size={18} />
            {page.suburb}
          </div>
          <h1 className="text-4xl font-bold mb-4 leading-tight">{page.heading}</h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">

        <div className="prose prose-lg max-w-none text-gray-700 leading-relaxed whitespace-pre-wrap">
          {page.intro}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {HIGHLIGHTS.map((h) => (
            <div key={h.label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <h.icon size={22} className="text-[hsl(25,95%,53%)] mb-2" />
              <h3 className="font-bold text-[hsl(214,60%,14%)] mb-1">{h.label}</h3>
              <p className="text-sm text-gray-600">{h.desc}</p>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="font-bold text-[hsl(214,60%,14%)] mb-4">Services we offer in {page.suburb}</h2>
          {page.servicesCopy ? (
            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{page.servicesCopy}</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {DEFAULT_SERVICES.map((s) => (
                <div key={s} className="flex items-center gap-2 text-gray-700">
                  <Check size={16} className="text-[hsl(25,95%,53%)] shrink-0" />
                  {s}
                </div>
              ))}
            </div>
          )}
          <Link href="/services" className="inline-block mt-4 text-[hsl(25,95%,53%)] font-semibold hover:underline">
            View all services →
          </Link>
        </div>

        {page.recentProjects && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="font-bold text-[hsl(214,60%,14%)] mb-3">Recent work in {page.suburb}</h2>
            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{page.recentProjects}</p>
            {page.portfolioSuburb && (
              <Link
                href={`/portfolio?suburb=${encodeURIComponent(page.portfolioSuburb)}`}
                className="inline-block mt-4 text-[hsl(25,95%,53%)] font-semibold hover:underline"
              >
                View {page.suburb} portfolio →
              </Link>
            )}
          </div>
        )}

        {page.localTestimonial && (
          <div className="bg-[hsl(210,20%,98%)] border-l-4 border-[hsl(25,95%,53%)] rounded-r-xl px-6 py-5">
            <Quote size={20} className="text-[hsl(25,95%,53%)] mb-2" />
            <blockquote className="text-gray-700 italic leading-relaxed text-lg mb-3">
              "{page.localTestimonial}"
            </blockquote>
            {page.localTestimonialAuthor && (
              <p className="text-sm font-semibold text-[hsl(214,60%,14%)]">— {page.localTestimonialAuthor}</p>
            )}
          </div>
        )}

        {localFaqs.length > 0 && (
          <div>
            <h2 className="font-bold text-[hsl(214,60%,14%)] mb-4">
              Common questions about electricians in {page.suburb}
            </h2>
            <FaqAccordion faqs={localFaqs} />
          </div>
        )}

        {nearbyAreaList.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="font-bold text-[hsl(214,60%,14%)] mb-3">
              We also cover areas near {page.suburb}
            </h2>
            <div className="flex flex-wrap gap-2">
              {nearbyAreaList.map((area) => (
                <span
                  key={area}
                  className="inline-block bg-[hsl(210,20%,96%)] text-[hsl(214,60%,14%)] text-sm font-medium px-3 py-1.5 rounded-full border border-gray-200"
                >
                  {area}
                </span>
              ))}
            </div>
            <p className="text-sm text-gray-500 mt-3">
              Call us on <a href="tel:0419868703" className="font-semibold text-[hsl(25,95%,53%)] hover:underline">0419 868 703</a> to discuss work anywhere in the Mornington Peninsula, St Kilda, or Warragul.
            </p>
          </div>
        )}

        <div className="bg-[hsl(214,60%,14%)] text-white rounded-2xl p-8 text-center">
          <h3 className="text-xl font-bold mb-2">Need an electrician in {page.suburb}?</h3>
          <p className="text-gray-300 mb-5">Get a free quote or book a job — we'd love to help.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/quote" className="inline-flex items-center gap-2 bg-[hsl(25,95%,53%)] hover:bg-[hsl(25,95%,45%)] text-white font-semibold px-6 py-3 rounded-lg transition-colors">
              Get a Free Quote
            </Link>
            <a href="tel:0419868703" className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-semibold px-6 py-3 rounded-lg transition-colors">
              <Phone size={16} />
              Call 0419 868 703
            </a>
          </div>
        </div>

      </div>
    </div>
  );
}
