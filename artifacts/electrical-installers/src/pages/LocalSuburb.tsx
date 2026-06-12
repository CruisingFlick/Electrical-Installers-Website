import { Link } from "wouter";
import { MapPin, Phone, Check, Shield, Clock, Star, ArrowRight } from "lucide-react";
import {
  SUBURB_BY_SLUG,
  REC_NUMBER,
  BUSINESS_PHONE,
  BUSINESS_PHONE_TEL,
  SITE_URL,
} from "@workspace/site-content";
import NotFound from "@/pages/not-found";
import { useJsonLd } from "@/hooks/useJsonLd";
import { usePageMeta } from "@/hooks/usePageMeta";

const HIGHLIGHTS = [
  { icon: Shield, label: "Licensed & insured", desc: `${REC_NUMBER} — fully compliant work` },
  { icon: Clock, label: "Prompt & reliable", desc: "On-time arrivals, tidy workmanship" },
  { icon: Star, label: "Locally trusted", desc: "Highly rated by local customers" },
];

export default function LocalSuburbPage({ slug }: { slug: string }) {
  const page = SUBURB_BY_SLUG[slug];

  usePageMeta({
    title: page ? page.title : "Local Electricians | Electrical Installers",
    description: page
      ? page.description
      : "Licensed electricians serving your area. Residential and commercial electrical work.",
    path: `/${slug}`,
  });

  const pageUrl = `${SITE_URL}/${slug}`;

  useJsonLd(
    page
      ? {
          "@context": "https://schema.org",
          "@type": "Service",
          name: `Electrician in ${page.suburb}`,
          description: page.intro,
          areaServed: { "@type": "Place", name: page.suburb },
          url: pageUrl,
          mainEntityOfPage: { "@type": "WebPage", "@id": pageUrl },
          provider: {
            "@type": "Electrician",
            "@id": `${SITE_URL}/#business`,
            name: "Electrical Installers",
            url: SITE_URL,
            telephone: "+61419868703",
          },
        }
      : null,
  );

  if (!page) {
    return <NotFound />;
  }

  const nearby = page.nearby
    .map((s) => SUBURB_BY_SLUG[s])
    .filter((s): s is NonNullable<typeof s> => Boolean(s));

  return (
    <div>
      <div className="bg-[hsl(214,60%,14%)] text-white py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 text-[hsl(25,95%,63%)] font-semibold mb-3">
            <MapPin size={18} />
            {page.suburb}
          </div>
          <h1 className="text-4xl font-bold mb-4 leading-tight">{page.heading}</h1>
          <p className="text-gray-300 max-w-2xl">
            Licensed Victorian electricians ({REC_NUMBER}) serving {page.suburb} and the
            surrounding Mornington Peninsula.
          </p>
          <a
            href={BUSINESS_PHONE_TEL}
            className="inline-flex items-center gap-2 mt-6 bg-[hsl(25,95%,53%)] hover:bg-[hsl(25,95%,45%)] text-white font-semibold px-6 py-3 rounded-lg transition-colors"
            data-testid="suburb-call-now"
          >
            <Phone size={18} />
            Call {BUSINESS_PHONE}
          </a>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
        <div className="prose prose-lg max-w-none text-gray-700 leading-relaxed">
          <p>{page.intro}</p>
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
          <h2 className="font-bold text-[hsl(214,60%,14%)] mb-4 text-xl">
            Electrical services in {page.suburb}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {page.services.map((s) => (
              <div key={s} className="flex items-center gap-2 text-gray-700">
                <Check size={16} className="text-[hsl(25,95%,53%)] shrink-0" />
                {s}
              </div>
            ))}
          </div>
          <Link
            href="/services"
            className="inline-flex items-center gap-1 mt-4 text-[hsl(25,95%,53%)] font-semibold hover:underline"
          >
            View all services <ArrowRight size={16} />
          </Link>
        </div>

        {nearby.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="font-bold text-[hsl(214,60%,14%)] mb-4 text-xl">
              Nearby areas we cover
            </h2>
            <div className="flex flex-wrap gap-3">
              {nearby.map((n) => (
                <Link
                  key={n.slug}
                  href={`/${n.slug}`}
                  className="inline-flex items-center gap-1.5 bg-[hsl(210,20%,96%)] hover:bg-[hsl(210,20%,92%)] text-[hsl(214,60%,14%)] text-sm font-medium px-4 py-2 rounded-full border border-gray-200 transition-colors"
                >
                  <MapPin size={14} className="text-[hsl(25,95%,53%)]" />
                  Electrician {n.suburb}
                </Link>
              ))}
            </div>
          </div>
        )}

        <div className="bg-[hsl(214,60%,14%)] text-white rounded-2xl p-8 text-center">
          <h2 className="text-xl font-bold mb-2">Need an electrician in {page.suburb}?</h2>
          <p className="text-gray-300 mb-5">
            Get a free quote or book a job — we'd love to help. Fully licensed under {REC_NUMBER}.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/book"
              className="inline-flex items-center justify-center gap-2 bg-[hsl(25,95%,53%)] hover:bg-[hsl(25,95%,45%)] text-white font-semibold px-6 py-3 rounded-lg transition-colors"
            >
              Book an Electrician
            </Link>
            <a
              href={BUSINESS_PHONE_TEL}
              className="inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
            >
              <Phone size={16} />
              Call {BUSINESS_PHONE}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
