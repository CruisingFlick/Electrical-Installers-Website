import { useState, useEffect, useCallback } from "react";
import { useListPortfolioItems, getListPortfolioItemsQueryKey } from "@workspace/api-client-react";
import { Filter, Images, X, ChevronLeft, ChevronRight } from "lucide-react";
import BeforeAfterSlider from "@/components/BeforeAfterSlider";
import { usePageMeta } from "@/hooks/usePageMeta";

const categories = ["All", "New Homes", "3-Phase Upgrade", "Underground Power", "Commercial", "Renovations"];

const FALLBACK = "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=800";
const FALLBACK_BEFORE = "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800";

type LightboxPhoto =
  | { type: "image"; url: string; title: string }
  | { type: "compare"; beforeUrl: string; afterUrl: string; title: string };

interface LightboxState {
  photos: LightboxPhoto[];
  index: number;
}

export default function PortfolioPage() {
  usePageMeta({
    title: "Electrical Work Portfolio | Before & After Photos",
    description: "Browse before and after photos of our completed electrical projects across the Mornington Peninsula, Bayside, and South East Melbourne. Residential and commercial work.",
    path: "/portfolio",
  });
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [lightbox, setLightbox] = useState<LightboxState | null>(null);

  const { data: portfolio = [], isLoading } = useListPortfolioItems(
    selectedCategory ? { category: selectedCategory } : undefined,
    { query: { queryKey: getListPortfolioItemsQueryKey(selectedCategory ? { category: selectedCategory } : undefined) } }
  );

  const openLightbox = (photos: LightboxPhoto[], index: number) => {
    setLightbox({ photos, index });
  };

  const closeLightbox = useCallback(() => setLightbox(null), []);

  const goPrev = useCallback(() => {
    setLightbox((lb) => lb ? { ...lb, index: (lb.index - 1 + lb.photos.length) % lb.photos.length } : null);
  }, []);

  const goNext = useCallback(() => {
    setLightbox((lb) => lb ? { ...lb, index: (lb.index + 1) % lb.photos.length } : null);
  }, []);

  useEffect(() => {
    if (!lightbox) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeLightbox();
      else if (e.key === "ArrowLeft") goPrev();
      else if (e.key === "ArrowRight") goNext();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [lightbox, closeLightbox, goPrev, goNext]);

  return (
    <div>
      {/* Lightbox overlay */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
          onClick={closeLightbox}
        >
          {/* Close button */}
          <button
            className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors z-10"
            onClick={closeLightbox}
            aria-label="Close"
          >
            <X size={32} />
          </button>

          {/* Prev button */}
          {lightbox.photos.length > 1 && (
            <button
              className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:text-gray-300 transition-colors z-10 bg-black/40 rounded-full p-2"
              onClick={(e) => { e.stopPropagation(); goPrev(); }}
              aria-label="Previous photo"
            >
              <ChevronLeft size={32} />
            </button>
          )}

          {/* Image */}
          <div
            className="max-w-[90vw] max-h-[90vh] flex flex-col items-center gap-3"
            onClick={(e) => e.stopPropagation()}
          >
            {(() => {
              const photo = lightbox.photos[lightbox.index];
              if (photo.type === "compare") {
                return (
                  <BeforeAfterSlider
                    beforeUrl={photo.beforeUrl}
                    afterUrl={photo.afterUrl}
                    className="w-[90vw] max-w-3xl aspect-[4/3] rounded shadow-2xl"
                    onBeforeError={(e) => { (e.target as HTMLImageElement).src = FALLBACK_BEFORE; }}
                    onAfterError={(e) => { (e.target as HTMLImageElement).src = FALLBACK; }}
                  />
                );
              }
              return (
                <img
                  src={photo.url}
                  alt={photo.title}
                  className="max-w-full max-h-[80vh] object-contain rounded shadow-2xl"
                  onError={(e) => { (e.target as HTMLImageElement).src = FALLBACK; }}
                />
              );
            })()}
            <div className="text-white text-sm text-center">
              {lightbox.photos[lightbox.index].title}
              {lightbox.photos.length > 1 && (
                <span className="text-gray-400 ml-2">({lightbox.index + 1} / {lightbox.photos.length})</span>
              )}
            </div>
          </div>

          {/* Next button */}
          {lightbox.photos.length > 1 && (
            <button
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:text-gray-300 transition-colors z-10 bg-black/40 rounded-full p-2"
              onClick={(e) => { e.stopPropagation(); goNext(); }}
              aria-label="Next photo"
            >
              <ChevronRight size={32} />
            </button>
          )}
        </div>
      )}

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
            {portfolio.map((item) => {
              const afterPhotos = item.afterImageUrls ?? [];
              const beforePhotos = item.beforeImageUrls ?? [];
              const totalPhotos = afterPhotos.length + beforePhotos.length;
              const thumb = afterPhotos[0] ?? FALLBACK;

              const hasCompare = beforePhotos.length > 0 && afterPhotos.length > 0;
              const allPhotos: LightboxPhoto[] = [
                ...(hasCompare
                  ? [{
                      type: "compare" as const,
                      beforeUrl: beforePhotos[0] || FALLBACK_BEFORE,
                      afterUrl: afterPhotos[0] || FALLBACK,
                      title: `${item.title} — Before & After (drag to compare)`,
                    }]
                  : []),
                ...afterPhotos.map((url, i) => ({
                  type: "image" as const,
                  url: url || FALLBACK,
                  title: `${item.title} — After${afterPhotos.length > 1 ? ` (${i + 1}/${afterPhotos.length})` : ""}`,
                })),
                ...beforePhotos.map((url, i) => ({
                  type: "image" as const,
                  url: url || FALLBACK_BEFORE,
                  title: `${item.title} — Before${beforePhotos.length > 1 ? ` (${i + 1}/${beforePhotos.length})` : ""}`,
                })),
              ];

              return (
                <div
                  key={item.id}
                  className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 group"
                  data-testid={`portfolio-item-${item.id}`}
                >
                  {/* Thumbnail */}
                  <div className="relative h-52 overflow-hidden">
                    <button
                      className="block w-full h-full text-left"
                      onClick={() => openLightbox(allPhotos, 0)}
                      aria-label={`Open photos for ${item.title}`}
                    >
                      <img
                        src={thumb}
                        alt={item.title}
                        className="w-full h-full object-cover cursor-pointer transition-[filter,transform] duration-300 group-hover:scale-105 hover:brightness-110"
                        onError={(e) => { (e.target as HTMLImageElement).src = FALLBACK; }}
                      />
                    </button>

                    {/* Photo count badge */}
                    {totalPhotos > 1 && (
                      <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-0.5 rounded flex items-center gap-1 pointer-events-none">
                        <Images size={11} />
                        {totalPhotos} photos
                      </div>
                    )}

                    {/* Before/After badge */}
                    {beforePhotos.length > 0 && afterPhotos.length > 0 && (
                      <div className="absolute top-2 left-2 bg-[hsl(214,60%,14%)]/80 text-white text-xs px-2 py-0.5 rounded pointer-events-none">
                        Before &amp; After
                      </div>
                    )}
                  </div>

                  <div className="p-5">
                    <span className="text-xs font-semibold text-[hsl(25,95%,53%)] uppercase tracking-wide">{item.category}</span>
                    <h3 className="font-semibold text-[hsl(214,60%,14%)] mt-1 mb-2">{item.title}</h3>
                    <p className="text-sm text-gray-600 leading-relaxed">{item.description}</p>
                    <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
                      <span>{item.suburb}</span>
                      {totalPhotos > 1 && (
                        <button
                          className="text-[hsl(25,95%,53%)] font-medium cursor-pointer hover:underline"
                          onClick={() => openLightbox(allPhotos, 0)}
                        >
                          View all {totalPhotos} photos →
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
