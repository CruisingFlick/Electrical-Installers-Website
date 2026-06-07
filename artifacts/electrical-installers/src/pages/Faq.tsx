import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Link } from "wouter";
import { ChevronDown, HelpCircle, Phone } from "lucide-react";
import { apiGet, type Faq } from "@/lib/cms";

export default function FaqPage() {
  const { data: faqs = [], isLoading } = useQuery({
    queryKey: ["faqs"],
    queryFn: () => apiGet<Faq[]>("/faqs"),
  });
  const [open, setOpen] = useState<number | null>(null);

  return (
    <div>
      <div className="bg-[hsl(214,60%,14%)] text-white py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold mb-4">Frequently Asked Questions</h1>
          <p className="text-gray-300 text-lg">
            Answers to the questions we hear most often. Can't find what you need? Give us a call.
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {isLoading ? (
          <div className="space-y-3">{[1, 2, 3, 4].map((i) => <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />)}</div>
        ) : faqs.length === 0 ? (
          <div className="text-center py-20">
            <HelpCircle size={48} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-xl font-semibold text-[hsl(214,60%,14%)] mb-2">No questions yet</h3>
            <p className="text-gray-500">Check back soon, or contact us directly.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {faqs.map((faq) => {
              const isOpen = open === faq.id;
              return (
                <div key={faq.id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                  <button
                    onClick={() => setOpen(isOpen ? null : faq.id)}
                    className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left"
                    data-testid={`faq-question-${faq.id}`}
                  >
                    <span className="font-semibold text-[hsl(214,60%,14%)]">{faq.question}</span>
                    <ChevronDown size={20} className={`shrink-0 text-[hsl(25,95%,53%)] transition-transform ${isOpen ? "rotate-180" : ""}`} />
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-5 -mt-1 text-gray-600 leading-relaxed whitespace-pre-wrap">{faq.answer}</div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-12 bg-[hsl(214,60%,14%)] text-white rounded-2xl p-8 text-center">
          <h3 className="text-xl font-bold mb-2">Still have questions?</h3>
          <p className="text-gray-300 mb-5">We're happy to help — no obligation.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a href="tel:0419868703" className="inline-flex items-center gap-2 bg-[hsl(25,95%,53%)] hover:bg-[hsl(25,95%,45%)] text-white font-semibold px-6 py-3 rounded-lg transition-colors">
              <Phone size={16} />
              Call 0419 868 703
            </a>
            <Link href="/messages" className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-semibold px-6 py-3 rounded-lg transition-colors">
              Message Us
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
