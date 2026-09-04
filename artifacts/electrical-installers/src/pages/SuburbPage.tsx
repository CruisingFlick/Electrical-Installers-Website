import { useParams, Link } from "wouter";
import { ShieldCheck, Clock, Star, Phone, ArrowRight, CheckCircle2 } from "lucide-react";
import { useDocumentMeta } from "@/hooks/useDocumentMeta";
import { SUBURBS_BY_SLUG } from "@/data/suburbs";
import NotFound from "@/pages/not-found";

const trustPoints = [
  {
    icon: ShieldCheck,
    title: "Licensed & insured",
    desc: "REC 25510 — fully compliant work",
  },
  {
    icon: Clock,
    title: "Prompt & reliable",
    desc: "On-time arrivals, tidy workmanship",
  },
  {
    icon: Star,
    title: "Locally trusted",
    desc: "Highly rated by local customers",
  },
];

export default function SuburbPage() {
  const params = useParams<{ slug: string }>();
  const suburb = SUBURBS_BY_SLUG[params.slug ?? ""];

  // Always call the hook (rules of hooks) — fall back to generic copy
  // when the slug doesn't match a known suburb, then render NotFound.
  useDocumentMeta(
    suburb?.title ?? "Page Not Found | Electrical Installers",
    suburb?.metaDescription ?? "",
  );

  if (!suburb) {
    return <NotFound />;
  }

  return (
    <div>
      {/* Header */}
      <div className="bg-[hsl(214,60%,14%)] text-white py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-[hsl(25,95%,53%)] font-semibold text-sm uppercase tracking-wide mb-2">
            {suburb.name}
          </p>
          <h1 className="text-3xl sm:text-4xl font-bold mb-4">{suburb.h1}</h1>
          <p className="text-gray-300 text-lg max-w-2xl mb-6">
            Licensed Victorian electricians (REC 25510) serving {suburb.name} and the surrounding
            Mornington Peninsula.
          </p>
          <a
            href="tel:0419868703"
            className="inline-flex items-center gap-2 bg-[hsl(25,95%,53%)] hover:bg-[hsl(25,95%,45%)] text-white font-bold px-5 py-3 rounded-full transition-colors"
          >
            <Phone size={16} />
            Call 0419 868 703
          </a>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Intro */}
        <p className="text-gray-700 text-base leading-relaxed max-w-3xl">{suburb.intro}</p>

        {/* Trust points */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-10">
          {trustPoints.map((point) => (
            <div
              key={point.title}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-start gap-3"
            >
              <point.icon size={22} className="text-[hsl(25,95%,53%)] flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-[hsl(214,60%,14%)] text-sm">{point.title}</p>
                <p className="text-xs text-gray-500 mt-0.5">{point.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Services */}
        <div className="mt-14">
          <h2 className="text-2xl font-bold text-[hsl(214,60%,14%)] mb-6">
            Electrical services in {suburb.name}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {suburb.services.map((service) => (
              <div
                key={service}
                className="flex items-center gap-3 bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-3"
              >
                <CheckCircle2 size={18} className="text-[hsl(25,95%,53%)] flex-shrink-0" />
                <span className="text-sm text-gray-700">{service}</span>
              </div>
            ))}
          </div>
          <Link
            href="/services"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[hsl(25,95%,53%)] hover:underline mt-5"
          >
            View all services
            <ArrowRight size={14} />
          </Link>
        </div>

        {/* Nearby areas */}
        <div className="mt-14">
          <h2 className="text-2xl font-bold text-[hsl(214,60%,14%)] mb-6">Nearby areas we cover</h2>
          <div className="flex flex-wrap gap-3">
            {suburb.nearby.map((slug) => {
              const nearbySuburb = SUBURBS_BY_SLUG[slug];
              if (!nearbySuburb) return null;
              return (
                <Link
                  key={slug}
                  href={`/electrician-${slug}`}
                  className="text-sm bg-white border border-gray-100 shadow-sm text-[hsl(214,60%,14%)] px-4 py-2 rounded-full hover:border-[hsl(25,95%,53%)] transition-colors"
                >
                  Electrician {nearbySuburb.name}
                </Link>
              );
            })}
          </div>
        </div>

        {/* CTA */}
        <div className="mt-16 bg-[hsl(214,60%,14%)] rounded-2xl px-6 py-10 sm:px-10 text-center text-white">
          <h2 className="text-2xl font-bold mb-2">Need an electrician in {suburb.name}?</h2>
          <p className="text-gray-300 mb-6 max-w-xl mx-auto">
            Get a free quote or book a job — we'd love to help. Fully licensed under REC 25510.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/book"
              className="inline-flex items-center gap-2 bg-[hsl(25,95%,53%)] hover:bg-[hsl(25,95%,45%)] text-white font-bold px-6 py-3 rounded-full transition-colors"
            >
              Book an Electrician
            </Link>
            <a
              href="tel:0419868703"
              className="inline-flex items-center gap-2 border border-white/30 hover:border-white text-white font-semibold px-6 py-3 rounded-full transition-colors"
            >
              <Phone size={16} />
              Call 0419 868 703
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
