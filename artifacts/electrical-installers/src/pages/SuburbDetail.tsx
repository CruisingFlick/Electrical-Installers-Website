import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "wouter";
import { MapPin, Phone, Check, Shield, Clock, Star } from "lucide-react";
import { apiGet, type SuburbPage } from "@/lib/cms";
import NotFound from "@/pages/not-found";
import { useJsonLd } from "@/hooks/useJsonLd";

const HIGHLIGHTS = [
  { icon: Shield, label: "Licensed & insured", desc: "REC 25510 — fully compliant work" },
  { icon: Clock, label: "Prompt & reliable", desc: "On-time arrivals, tidy workmanship" },
  { icon: Star, label: "Locally trusted", desc: "Highly rated by local customers" },
];

export default function SuburbDetailPage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug ?? "";
  const { data: page, isLoading, error } = useQuery({
    queryKey: ["suburb-page", slug],
    queryFn: () => apiGet<SuburbPage>(`/suburb-pages/${slug}`),
    enabled: !!slug,
    retry: false,
  });

  const pageUrl = `https://www.electricalinstallers.com.au/${slug}`;
  useJsonLd(page ? {
    "@context": "https://schema.org",
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

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="prose prose-lg max-w-none text-gray-700 leading-relaxed whitespace-pre-wrap mb-10">
          {page.intro}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
          {HIGHLIGHTS.map((h) => (
            <div key={h.label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <h.icon size={22} className="text-[hsl(25,95%,53%)] mb-2" />
              <h3 className="font-bold text-[hsl(214,60%,14%)] mb-1">{h.label}</h3>
              <p className="text-sm text-gray-600">{h.desc}</p>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-10">
          <h2 className="font-bold text-[hsl(214,60%,14%)] mb-4">Services we offer in {page.suburb}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {["New homes & renovations", "Switchboard upgrades", "Power points & lighting", "Safety inspections", "3-phase upgrades", "Underground power"].map((s) => (
              <div key={s} className="flex items-center gap-2 text-gray-700">
                <Check size={16} className="text-[hsl(25,95%,53%)] shrink-0" />
                {s}
              </div>
            ))}
          </div>
          <Link href="/services" className="inline-block mt-4 text-[hsl(25,95%,53%)] font-semibold hover:underline">
            View all services →
          </Link>
        </div>

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
