import { Link, useLocation } from "wouter";
import { LayoutDashboard, Calendar, Image, Star, FileText, Map, LogOut, Zap, Menu, X } from "lucide-react";
import { useState } from "react";

const navItems = [
  { href: "/admin/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/admin/bookings", icon: Calendar, label: "Bookings" },
  { href: "/admin/portfolio", icon: Image, label: "Portfolio" },
  { href: "/admin/reviews", icon: Star, label: "Reviews" },
  { href: "/admin/quotes", icon: FileText, label: "Quotes" },
  { href: "/admin/jobs", icon: Map, label: "Job Map" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  function logout() {
    localStorage.removeItem("admin_auth");
    setLocation("/admin");
  }

  return (
    <div className="min-h-screen flex bg-[hsl(210,20%,96%)]">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 w-60 bg-[hsl(214,60%,14%)] text-white flex flex-col z-40 transform transition-transform ${mobileOpen ? "translate-x-0" : "-translate-x-full"} md:relative md:translate-x-0`}>
        <div className="flex items-center gap-2 px-5 py-4 border-b border-[hsl(214,50%,22%)]">
          <div className="bg-[hsl(25,95%,53%)] rounded p-1">
            <Zap size={16} />
          </div>
          <div>
            <p className="font-bold text-sm">Electrical Installers</p>
            <p className="text-xs text-gray-400">Admin Panel</p>
          </div>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                location === item.href || location.startsWith(item.href)
                  ? "bg-[hsl(25,95%,53%)] text-white"
                  : "text-gray-300 hover:bg-[hsl(214,50%,22%)] hover:text-white"
              }`}
              onClick={() => setMobileOpen(false)}
              data-testid={`admin-nav-${item.label.toLowerCase()}`}
            >
              <item.icon size={18} />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="px-3 py-4 border-t border-[hsl(214,50%,22%)]">
          <button
            onClick={logout}
            className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm text-gray-300 hover:bg-[hsl(214,50%,22%)] hover:text-white transition-colors"
            data-testid="button-admin-logout"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && <div className="fixed inset-0 bg-black/50 z-30 md:hidden" onClick={() => setMobileOpen(false)} />}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-gray-100 px-6 py-3 flex items-center justify-between md:hidden">
          <button onClick={() => setMobileOpen(true)} className="p-2 rounded-lg hover:bg-gray-100">
            <Menu size={20} />
          </button>
          <span className="font-semibold text-[hsl(214,60%,14%)]">Admin</span>
          <Link href="/" className="text-sm text-[hsl(25,95%,53%)]">View Site</Link>
        </header>

        <main className="flex-1 p-6">
          <div className="hidden md:flex justify-end mb-4">
            <Link href="/" className="text-sm text-[hsl(25,95%,53%)] hover:underline">View Site</Link>
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}
