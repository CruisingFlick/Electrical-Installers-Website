import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ShareButton from "@/components/ShareButton";
import QrButton from "@/components/QrButton";
import ChatWidget from "@/components/ChatWidget";
import { Phone } from "lucide-react";
import { useState, useEffect, lazy, Suspense } from "react";
import { LOCAL_SUBURBS } from "@workspace/site-content";

const HomePage = lazy(() => import("@/pages/Home"));
const AboutPage = lazy(() => import("@/pages/About"));
const ServicesPage = lazy(() => import("@/pages/Services"));
const UndergroundPowerPage = lazy(() => import("@/pages/UndergroundPower"));
const PortfolioPage = lazy(() => import("@/pages/Portfolio"));
const ReviewsPage = lazy(() => import("@/pages/Reviews"));
const BookPage = lazy(() => import("@/pages/Book"));
const QuotePage = lazy(() => import("@/pages/Quote"));
const MessagesPage = lazy(() => import("@/pages/Messages"));
const NotFound = lazy(() => import("@/pages/not-found"));

const AdminLogin = lazy(() => import("@/pages/admin/Login"));
const AdminDashboard = lazy(() => import("@/pages/admin/Dashboard"));
const AdminBookings = lazy(() => import("@/pages/admin/Bookings"));
const AdminPortfolio = lazy(() => import("@/pages/admin/Portfolio"));
const AdminReviews = lazy(() => import("@/pages/admin/Reviews"));
const AdminQuotes = lazy(() => import("@/pages/admin/Quotes"));
const AdminJobMap = lazy(() => import("@/pages/admin/JobMap"));
const AdminAiSettings = lazy(() => import("@/pages/admin/AiSettings"));
const AdminCalendarView = lazy(() => import("@/pages/admin/CalendarView"));
const AdminMediaLibrary = lazy(() => import("@/pages/admin/MediaLibrary"));
const AdminCustomers = lazy(() => import("@/pages/admin/Customers"));
const AdminBlog = lazy(() => import("@/pages/admin/Blog"));
const AdminSiteSettings = lazy(() => import("@/pages/admin/SiteSettings"));
const AdminMessages = lazy(() => import("@/pages/admin/Messages"));
const ServiceAreaPage = lazy(() => import("@/pages/ServiceArea"));
const PrivacyPolicyPage = lazy(() => import("@/pages/PrivacyPolicy"));
const TrackBookingPage = lazy(() => import("@/pages/TrackBooking"));
const BlogPage = lazy(() => import("@/pages/Blog"));
const BlogPostPage = lazy(() => import("@/pages/BlogPost"));
const FaqPage = lazy(() => import("@/pages/Faq"));
const PricingPage = lazy(() => import("@/pages/Pricing"));
const ServiceDetailPage = lazy(() => import("@/pages/ServiceDetail"));
const SuburbDetailPage = lazy(() => import("@/pages/SuburbDetail"));
const LocalSuburbPage = lazy(() => import("@/pages/LocalSuburb"));

const AdminFaqs = lazy(() => import("@/pages/admin/Faqs"));
const AdminPricing = lazy(() => import("@/pages/admin/Pricing"));
const AdminServicePages = lazy(() => import("@/pages/admin/ServicePages"));
const AdminSuburbPages = lazy(() => import("@/pages/admin/SuburbPages"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        if ((error as Error)?.name === "AbortError") return false;
        return failureCount < 3;
      },
    },
  },
});

function PageFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[hsl(210,20%,98%)]">
      <div className="text-gray-400 text-sm">Loading…</div>
    </div>
  );
}

function AdminGuard({ component: Component }: { component: React.ComponentType }) {
  const [status, setStatus] = useState<"loading" | "ok" | "denied">("loading");

  useEffect(() => {
    fetch("/api/admin/me", { credentials: "same-origin" })
      .then((res) => setStatus(res.ok ? "ok" : "denied"))
      .catch(() => setStatus("denied"));
  }, []);

  useEffect(() => {
    document.body.classList.add("admin-view");
    return () => document.body.classList.remove("admin-view");
  }, []);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[hsl(210,20%,96%)]">
        <div className="text-gray-500 text-sm">Loading…</div>
      </div>
    );
  }
  if (status === "denied") return <Redirect to="/admin" />;
  return <Component />;
}

function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 pb-16 sm:pb-0">{children}</main>
      <Footer />
      {/* Sticky Call Now — mobile only */}
      <a
        href="tel:0419868703"
        className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-center gap-3 bg-[hsl(25,95%,53%)] text-white font-bold text-lg py-4 sm:hidden shadow-2xl"
        data-testid="sticky-call-now"
      >
        <Phone size={22} />
        Call Now — 0419 868 703
      </a>
      <QrButton />
      <ShareButton />
      <ChatWidget />
    </div>
  );
}

function Router() {
  return (
    <Suspense fallback={<PageFallback />}>
      <Switch>
        {/* Public routes */}
        <Route path="/" component={() => <PublicLayout><HomePage /></PublicLayout>} />
        <Route path="/about" component={() => <PublicLayout><AboutPage /></PublicLayout>} />
        <Route path="/services" component={() => <PublicLayout><ServicesPage /></PublicLayout>} />
        <Route path="/underground-power" component={() => <PublicLayout><UndergroundPowerPage /></PublicLayout>} />
        <Route path="/portfolio" component={() => <PublicLayout><PortfolioPage /></PublicLayout>} />
        <Route path="/reviews" component={() => <PublicLayout><ReviewsPage /></PublicLayout>} />
        <Route path="/book" component={() => <PublicLayout><BookPage /></PublicLayout>} />
        <Route path="/quote" component={() => <PublicLayout><QuotePage /></PublicLayout>} />
        <Route path="/messages" component={() => <PublicLayout><MessagesPage /></PublicLayout>} />
        <Route path="/service-area" component={() => <PublicLayout><ServiceAreaPage /></PublicLayout>} />
        <Route path="/privacy-policy" component={() => <PublicLayout><PrivacyPolicyPage /></PublicLayout>} />
        <Route path="/track" component={() => <PublicLayout><TrackBookingPage /></PublicLayout>} />
        <Route path="/blog" component={() => <PublicLayout><BlogPage /></PublicLayout>} />
        <Route path="/blog/:slug" component={() => <PublicLayout><BlogPostPage /></PublicLayout>} />
        <Route path="/faq" component={() => <PublicLayout><FaqPage /></PublicLayout>} />
        <Route path="/pricing" component={() => <PublicLayout><PricingPage /></PublicLayout>} />
        <Route path="/services/:slug" component={() => <PublicLayout><ServiceDetailPage /></PublicLayout>} />

        {/* Admin routes */}
        <Route path="/admin" component={() => <Suspense fallback={<PageFallback />}><AdminLogin /></Suspense>} />
        <Route path="/admin/dashboard" component={() => <AdminGuard component={AdminDashboard} />} />
        <Route path="/admin/bookings" component={() => <AdminGuard component={AdminBookings} />} />
        <Route path="/admin/portfolio" component={() => <AdminGuard component={AdminPortfolio} />} />
        <Route path="/admin/reviews" component={() => <AdminGuard component={AdminReviews} />} />
        <Route path="/admin/quotes" component={() => <AdminGuard component={AdminQuotes} />} />
        <Route path="/admin/jobs" component={() => <AdminGuard component={AdminJobMap} />} />
        <Route path="/admin/ai-settings" component={() => <AdminGuard component={AdminAiSettings} />} />
        <Route path="/admin/calendar" component={() => <AdminGuard component={AdminCalendarView} />} />
        <Route path="/admin/media" component={() => <AdminGuard component={AdminMediaLibrary} />} />
        <Route path="/admin/customers" component={() => <AdminGuard component={AdminCustomers} />} />
        <Route path="/admin/blog" component={() => <AdminGuard component={AdminBlog} />} />
        <Route path="/admin/site-settings" component={() => <AdminGuard component={AdminSiteSettings} />} />
        <Route path="/admin/messages" component={() => <AdminGuard component={AdminMessages} />} />
        <Route path="/admin/faqs" component={() => <AdminGuard component={AdminFaqs} />} />
        <Route path="/admin/pricing" component={() => <AdminGuard component={AdminPricing} />} />
        <Route path="/admin/service-pages" component={() => <AdminGuard component={AdminServicePages} />} />
        <Route path="/admin/suburb-pages" component={() => <AdminGuard component={AdminSuburbPages} />} />

        {/* Static suburb landing pages — must come before the CMS catch-all */}
        {LOCAL_SUBURBS.map((s) => (
          <Route
            key={s.slug}
            path={`/${s.slug}`}
            component={() => <PublicLayout><LocalSuburbPage slug={s.slug} /></PublicLayout>}
          />
        ))}

        {/* CMS suburb landing pages — catch-all before NotFound */}
        <Route path="/:slug" component={() => <PublicLayout><SuburbDetailPage /></PublicLayout>} />

        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
