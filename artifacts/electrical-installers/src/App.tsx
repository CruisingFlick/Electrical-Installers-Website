import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ShareButton from "@/components/ShareButton";
import { Phone } from "lucide-react";

import HomePage from "@/pages/Home";
import AboutPage from "@/pages/About";
import ServicesPage from "@/pages/Services";
import UndergroundPowerPage from "@/pages/UndergroundPower";
import PortfolioPage from "@/pages/Portfolio";
import ReviewsPage from "@/pages/Reviews";
import BookPage from "@/pages/Book";
import QuotePage from "@/pages/Quote";
import NotFound from "@/pages/not-found";

import AdminLogin from "@/pages/admin/Login";
import AdminDashboard from "@/pages/admin/Dashboard";
import AdminBookings from "@/pages/admin/Bookings";
import AdminPortfolio from "@/pages/admin/Portfolio";
import AdminReviews from "@/pages/admin/Reviews";
import AdminQuotes from "@/pages/admin/Quotes";
import AdminJobMap from "@/pages/admin/JobMap";

const queryClient = new QueryClient();

function isAdminAuth() {
  return Boolean(localStorage.getItem("admin_token"));
}

function AdminGuard({ component: Component }: { component: React.ComponentType }) {
  if (!isAdminAuth()) {
    return <Redirect to="/admin" />;
  }
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
      <ShareButton />
    </div>
  );
}

function Router() {
  return (
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

      {/* Admin routes */}
      <Route path="/admin" component={AdminLogin} />
      <Route path="/admin/dashboard" component={() => <AdminGuard component={AdminDashboard} />} />
      <Route path="/admin/bookings" component={() => <AdminGuard component={AdminBookings} />} />
      <Route path="/admin/portfolio" component={() => <AdminGuard component={AdminPortfolio} />} />
      <Route path="/admin/reviews" component={() => <AdminGuard component={AdminReviews} />} />
      <Route path="/admin/quotes" component={() => <AdminGuard component={AdminQuotes} />} />
      <Route path="/admin/jobs" component={() => <AdminGuard component={AdminJobMap} />} />

      <Route component={NotFound} />
    </Switch>
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
