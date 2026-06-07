import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "wouter";
import { ArrowLeft, Check, Phone, Wrench, ArrowRight } from "lucide-react";
import { apiGet, type ServicePage } from "@/lib/cms";

export default function ServiceDetailPage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug ?? "";
  const { data: service, isLoading, error } = useQuery({
    queryKey: ["service-page", slug],
    queryFn: () => apiGet<ServicePage>(`/service-pages/${slug}`),
    enabled: !!slug,
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="space-y-4 animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-3/4" />
          <div className="h-4 bg-gray-100 rounded w-1/2" />
          <div className="h-64 bg-gray-100 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (error || !service) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <Wrench size={48} className="mx-auto text-gray-300 mb-4" />
        <h1 className="text-2xl font-bold text-[hsl(214,60%,14%)] mb-2">Service Not Found</h1>
        <p className="text-gray-500 mb-6">This service page doesn't exist or has been removed.</p>
        <Link href="/services" className="inline-flex items-center gap-2 text-[hsl(25,95%,53%)] font-semibold hover:underline">
          <ArrowLeft size={16} />
          Back to all services
        </Link>
      </div>
    );
  }

  return (
    <div>
      {service.heroImageUrl && (
        <div className="w-full h-64 sm:h-80 overflow-hidden">
          <img src={service.heroImageUrl} alt={service.title} className="w-full h-full object-cover" />
        </div>
      )}

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Link href="/services" className="inline-flex items-center gap-2 text-sm text-[hsl(25,95%,53%)] font-medium hover:underline mb-6">
          <ArrowLeft size={15} />
          All services
        </Link>

        <h1 className="text-3xl sm:text-4xl font-bold text-[hsl(214,60%,14%)] mb-4 leading-tight">{service.title}</h1>
        <p className="text-lg text-gray-600 mb-8 leading-relaxed border-l-4 border-[hsl(25,95%,53%)] pl-4">{service.shortDescription}</p>

        <div className="prose prose-lg max-w-none text-gray-700 leading-relaxed whitespace-pre-wrap mb-8">
          {service.fullDescription}
        </div>

        {service.bullets.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-8">
            <h2 className="font-bold text-[hsl(214,60%,14%)] mb-4">What's included</h2>
            <ul className="space-y-3">
              {service.bullets.map((b, i) => (
                <li key={i} className="flex items-start gap-3">
                  <Check size={18} className="text-[hsl(25,95%,53%)] shrink-0 mt-0.5" />
                  <span className="text-gray-700">{b}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {service.pricingBlurb && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 mb-8">
            <p className="text-amber-800 font-medium">{service.pricingBlurb}</p>
          </div>
        )}

        {service.portfolioCategory && (
          <Link
            href={`/portfolio?category=${encodeURIComponent(service.portfolioCategory)}`}
            className="inline-flex items-center gap-2 text-[hsl(25,95%,53%)] font-semibold hover:underline mb-8"
          >
            See examples of our {service.portfolioCategory} work
            <ArrowRight size={15} />
          </Link>
        )}

        <div className="mt-4 bg-[hsl(214,60%,14%)] text-white rounded-2xl p-8 text-center">
          <h3 className="text-xl font-bold mb-2">Ready to get started?</h3>
          <p className="text-gray-300 mb-5">Book a job or request a free quote today.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/book" className="inline-flex items-center gap-2 bg-[hsl(25,95%,53%)] hover:bg-[hsl(25,95%,45%)] text-white font-semibold px-6 py-3 rounded-lg transition-colors">
              Book Now
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
