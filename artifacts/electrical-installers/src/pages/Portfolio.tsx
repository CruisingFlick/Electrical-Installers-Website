import { useState, useEffect } from "react";
import { useListPortfolioItems, getListPortfolioItemsQueryKey } from "@workspace/api-client-react";
import { Filter } from "lucide-react";

declare const GLightbox: (options: Record<string, unknown>) => { destroy: () => void };

const categories = ["All", "New Homes", "3-Phase Upgrade", "Underground Power", "Commercial", "Renovations"];

const FALLBACK_AFTER = "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=800";
const FALLBACK_BEFORE = "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800";

export default function PortfolioPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const { data: portfolio = [], isLoading } = useListPortfolioItems(
    selectedCategory ? { category: selectedCategory } : undefined,
    { query: { queryKey: getListPortfolioItemsQueryKey(selectedCategory ? { category: selectedCategory } : undefined) } }
  );

  useEffect(() => {
    if (isLoading || portfolio.length === 0) return;

    let lightbox: { destroy: () => void } | null = null;

    const init = () => {
      if (typeof GLightbox === "undefined") return;
      lightbox = GLightbox({ touchNavigation: true, loop: true });
    };

    const timer = setTimeout(init, 100);

    return () => {
      clearTimeout(timer);
      lightbox?.destroy();
    };
  }, [portfolio, isLoading]);

  return (
    <div>
      <div className="bg-[hsl(214,60%,14%)] text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold mb-4">Our Portfolio</h1>
          <p className="text-gray-300 text-lg">Real jobs, real results. Completed work across Victoria.</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center gap-3 mb-8 flex-wrap">
          <Filter size={16} className="text-gray-500" />
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat === "All" ? "" : cat)}
              className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
                (cat === "All" && selectedCategory === "") || selectedCategory === cat
                  ? "bg-[hsl(25,95%,53%)] text-white border-[hsl(25,95%,53%)]"
                  : "border-gray-200 text-gray-600 hover:border-[hsl(25,95%,53%)] hover:text-[hsl(25,95%,53%)]"
              }`}
              data-testid={`filter-${cat.toLowerCase().replace(/\s+/g, "-")}`}
            >
              {cat}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-xl bg-gray-100 animate-pulse h-64" />
            ))}
          </div>
        ) : portfolio.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            <p className="text-lg font-medium">No portfolio items yet</p>
            <p className="text-sm mt-2">Check back soon for completed job photos.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {portfolio.map((item) => (
              <div key={item.id} className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 group" data-testid={`portfolio-item-${item.id}`}>
                {item.beforeImageUrl && item.afterImageUrl ? (
                  <div className="grid grid-cols-2 h-52">
                    <div className="relative overflow-hidden">
                      <a
                        href={item.beforeImageUrl || FALLBACK_BEFORE}
                        className="glightbox block w-full h-full"
                        data-gallery="portfolio"
                        data-title={`${item.title} — Before`}
                      >
                        <img
                          src={item.beforeImageUrl}
                          alt="Before"
                          className="w-full h-full object-cover cursor-pointer transition-[filter,transform] duration-300 hover:brightness-110 hover:scale-105"
                          onError={(e) => { (e.target as HTMLImageElement).src = FALLBACK_BEFORE; }}
                        />
                        <div className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-0.5 rounded pointer-events-none">Before</div>
                      </a>
                    </div>
                    <div className="relative overflow-hidden">
                      <a
                        href={item.afterImageUrl || FALLBACK_AFTER}
                        className="glightbox block w-full h-full"
                        data-gallery="portfolio"
                        data-title={`${item.title} — After`}
                      >
                        <img
                          src={item.afterImageUrl}
                          alt="After"
                          className="w-full h-full object-cover cursor-pointer transition-[filter,transform] duration-300 hover:brightness-110 hover:scale-105"
                          onError={(e) => { (e.target as HTMLImageElement).src = FALLBACK_AFTER; }}
                        />
                        <div className="absolute bottom-2 right-2 bg-[hsl(25,95%,53%)]/80 text-white text-xs px-2 py-0.5 rounded pointer-events-none">After</div>
                      </a>
                    </div>
                  </div>
                ) : (
                  <div className="h-52 overflow-hidden">
                    <a
                      href={item.afterImageUrl || FALLBACK_AFTER}
                      className="glightbox block w-full h-full"
                      data-gallery="portfolio"
                      data-title={item.title}
                    >
                      <img
                        src={item.afterImageUrl}
                        alt={item.title}
                        className="w-full h-full object-cover cursor-pointer transition-[filter,transform] duration-300 group-hover:scale-105 hover:brightness-110"
                        onError={(e) => { (e.target as HTMLImageElement).src = FALLBACK_AFTER; }}
                      />
                    </a>
                  </div>
                )}
                <div className="p-5">
                  <span className="text-xs font-semibold text-[hsl(25,95%,53%)] uppercase tracking-wide">{item.category}</span>
                  <h3 className="font-semibold text-[hsl(214,60%,14%)] mt-1 mb-2">{item.title}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">{item.description}</p>
                  <div className="mt-4 text-xs text-gray-500">
                    <span>{item.suburb}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
