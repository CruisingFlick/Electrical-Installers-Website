import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { DollarSign, Phone, Check } from "lucide-react";
import { apiGet, type PricingItem } from "@/lib/cms";
import { usePageMeta } from "@/hooks/usePageMeta";

export default function PricingPage() {
  usePageMeta({
    title: "Electrical Pricing Guide | Mornington Peninsula",
    description: "Indicative electrical pricing for common jobs on the Mornington Peninsula — power points, switchboard upgrades, underground power, lighting, and more.",
    path: "/pricing",
  });
  const { data: items = [], isLoading } = useQuery({
    queryKey: ["pricing"],
    queryFn: () => apiGet<PricingItem[]>("/pricing"),
  });

  return (
    <div>
      <div className="bg-[hsl(214,60%,14%)] text-white py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold mb-4">Pricing Guide</h1>
          <p className="text-gray-300 text-lg">
            Indicative price ranges to help you budget. Every job is different — contact us for a free, tailored quote.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {isLoading ? (
          <div className="space-y-3">{[1, 2, 3, 4].map((i) => <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />)}</div>
        ) : items.length === 0 ? (
          <div className="text-center py-20">
            <DollarSign size={48} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-xl font-semibold text-[hsl(214,60%,14%)] mb-2">Pricing coming soon</h3>
            <p className="text-gray-500">Contact us for a free quote in the meantime.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {items.map((item) => (
              <div key={item.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex flex-col">
                <div className="flex items-start justify-between gap-3 mb-1">
                  <h3 className="font-bold text-[hsl(214,60%,14%)]">{item.label}</h3>
                  <span className="shrink-0 font-bold text-[hsl(25,95%,53%)] whitespace-nowrap">{item.priceRange}</span>
                </div>
                {item.description && <p className="text-sm text-gray-600 leading-relaxed">{item.description}</p>}
              </div>
            ))}
          </div>
        )}

        <div className="mt-8 bg-amber-50 border border-amber-200 rounded-xl p-5 flex items-start gap-3">
          <Check size={18} className="text-amber-600 shrink-0 mt-0.5" />
          <p className="text-sm text-amber-800 leading-relaxed">
            Prices are indicative only and exclude GST unless stated. Final pricing depends on site conditions, materials, and scope. All quotes are free and obligation-free.
          </p>
        </div>

        <div className="mt-8 bg-[hsl(214,60%,14%)] text-white rounded-2xl p-8 text-center">
          <h3 className="text-xl font-bold mb-2">Want an exact price?</h3>
          <p className="text-gray-300 mb-5">Get a free, no-obligation quote tailored to your job.</p>
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
