import { Link } from "wouter";
import { useListReviews, useListPortfolioItems, useGetAnalyticsSummary } from "@workspace/api-client-react";
import { Star, Zap, Home as HomeIcon, Factory, Cable, ArrowRight, Phone, CheckCircle } from "lucide-react";

export default function HomePage() {
  const { data: reviews = [] } = useListReviews({ status: "approved" });
  const { data: portfolio = [] } = useListPortfolioItems();
  const approvedReviews = reviews.slice(0, 3);
  const recentPortfolio = portfolio.slice(0, 3);

  return (
    <div>
      {/* Hero */}
      <section className="relative bg-[hsl(214,60%,14%)] text-white overflow-hidden">
        <div className="absolute inset-0 opacity-20 bg-gradient-to-br from-[hsl(25,95%,53%)] to-transparent" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-[hsl(25,95%,53%)] text-white text-sm font-semibold px-3 py-1 rounded-full mb-6">
              <CheckCircle size={14} />
              Victorian Licensed Electricians
            </div>
            <h1 className="text-4xl lg:text-6xl font-extrabold leading-tight mb-6">
              Mornington Peninsula&apos;s Trusted Electrical Specialists
            </h1>
            <p className="text-lg text-gray-300 mb-8 leading-relaxed">
              From new homes to 3-phase industrial upgrades and underground power. Serving Mornington Peninsula and surrounding areas with over 15 years of experience.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/book"
                className="inline-flex items-center justify-center gap-2 bg-[hsl(25,95%,53%)] hover:bg-[hsl(25,95%,45%)] text-white font-semibold px-6 py-3 rounded-lg transition-colors"
                data-testid="hero-book-button"
              >
                Book a Consultation
                <ArrowRight size={18} />
              </Link>
              <Link
                href="/quote"
                className="inline-flex items-center justify-center gap-2 border-2 border-white/30 hover:border-white text-white font-semibold px-6 py-3 rounded-lg transition-colors"
                data-testid="hero-quote-button"
              >
                Get a Free Quote
              </Link>
            </div>
            <div className="flex items-center gap-2 mt-6 text-sm text-gray-400">
              <Phone size={16} />
              <span>Call us: <strong className="text-white text-[16px]">0419 868 703</strong></span>
            </div>
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-[hsl(214,60%,14%)]">Our Services</h2>
            <p className="mt-2 text-gray-500">Professional electrical solutions across Victoria</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: HomeIcon, title: "New Homes & Renovations", desc: "Complete electrical fit-outs for new builds and renovations.", href: "/services" },
              { icon: Factory, title: "Commercial & Industrial", desc: "Machinery wiring, factory fit-outs, and industrial upgrades.", href: "/services" },
              { icon: Zap, title: "3-Phase Upgrades", desc: "Upgrade to 3-phase power for workshops and heavy equipment.", href: "/services" },
              { icon: Cable, title: "Underground Power", desc: "Remove overhead lines with the United Energy process.", href: "/underground-power" },
            ].map((s) => (
              <Link
                key={s.title}
                href={s.href}
                className="group block bg-[hsl(210,20%,98%)] hover:bg-[hsl(214,60%,14%)] text-[hsl(214,60%,14%)] hover:text-white rounded-xl p-6 border border-gray-100 transition-all duration-200 shadow-sm hover:shadow-md"
                data-testid={`service-card-${s.title.toLowerCase().replace(/\s+/g, "-")}`}
              >
                <div className="bg-[hsl(25,95%,53%)]/10 group-hover:bg-[hsl(25,95%,53%)]/20 rounded-lg w-12 h-12 flex items-center justify-center mb-4 transition-colors">
                  <s.icon size={24} className="text-[hsl(25,95%,53%)]" />
                </div>
                <h3 className="font-semibold text-lg mb-2">{s.title}</h3>
                <p className="text-sm text-gray-500 group-hover:text-gray-300">{s.desc}</p>
                <div className="flex items-center gap-1 mt-4 text-sm font-medium text-[hsl(25,95%,53%)]">
                  Learn more <ArrowRight size={14} />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Portfolio Highlights */}
      {recentPortfolio.length > 0 && (
        <section className="py-16 bg-[hsl(210,20%,96%)]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-10">
              <div>
                <h2 className="text-3xl font-bold text-[hsl(214,60%,14%)]">Recent Work</h2>
                <p className="text-gray-500 mt-1">Completed jobs across our service areas</p>
              </div>
              <Link href="/portfolio" className="text-[hsl(25,95%,53%)] font-semibold hover:underline flex items-center gap-1">
                View all <ArrowRight size={16} />
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {recentPortfolio.map((item) => (
                <div key={item.id} className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100" data-testid={`portfolio-card-${item.id}`}>
                  <div className="h-48 bg-gray-100 overflow-hidden">
                    <img
                      src={item.afterImageUrl}
                      alt={item.title}
                      className="w-full h-full object-cover"
                      onError={(e) => { (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=400"; }}
                    />
                  </div>
                  <div className="p-4">
                    <span className="text-xs font-semibold text-[hsl(25,95%,53%)] uppercase tracking-wide">{item.category}</span>
                    <h3 className="font-semibold text-[hsl(214,60%,14%)] mt-1">{item.title}</h3>
                    <p className="text-sm text-gray-500 mt-1">{item.suburb} &bull; {item.completedDate}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Reviews */}
      {approvedReviews.length > 0 && (
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-10">
              <div>
                <h2 className="text-3xl font-bold text-[hsl(214,60%,14%)]">What Our Customers Say</h2>
                <p className="text-gray-500 mt-1">Verified customer reviews</p>
              </div>
              <Link href="/reviews" className="text-[hsl(25,95%,53%)] font-semibold hover:underline flex items-center gap-1">
                All reviews <ArrowRight size={16} />
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {approvedReviews.map((review) => (
                <div key={review.id} className="bg-[hsl(210,20%,98%)] rounded-xl p-6 border border-gray-100" data-testid={`review-card-${review.id}`}>
                  <div className="flex items-center gap-1 mb-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        size={16}
                        className={i < review.rating ? "text-[hsl(25,95%,53%)] fill-[hsl(25,95%,53%)]" : "text-gray-300"}
                      />
                    ))}
                  </div>
                  <p className="text-gray-700 text-sm italic mb-4">&ldquo;{review.comment}&rdquo;</p>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-sm">{review.customerName}</p>
                      <p className="text-xs text-gray-500">{review.suburb}</p>
                    </div>
                    {review.isVerified && (
                      <div className="flex items-center gap-1 text-xs text-green-600">
                        <CheckCircle size={12} />
                        Verified
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="bg-[hsl(25,95%,53%)] py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-white">
          <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-lg mb-8 text-white/90">Book a consultation or submit a virtual quote from the comfort of your home.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/book" className="inline-flex items-center justify-center gap-2 bg-white text-[hsl(25,95%,53%)] font-semibold px-8 py-3 rounded-lg hover:bg-gray-100 transition-colors" data-testid="cta-book-button">
              Book Now
            </Link>
            <Link href="/quote" className="inline-flex items-center justify-center gap-2 border-2 border-white text-white font-semibold px-8 py-3 rounded-lg hover:bg-white/10 transition-colors" data-testid="cta-quote-button">
              Get a Quote
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
