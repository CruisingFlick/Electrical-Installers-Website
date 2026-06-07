import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Menu, X, Phone } from "lucide-react";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/services", label: "Services" },
  { href: "/underground-power", label: "Underground Power" },
  { href: "/service-area", label: "Service Area" },
  { href: "/portfolio", label: "Portfolio" },
  { href: "/reviews", label: "Reviews" },
  { href: "/blog", label: "Tips & Guides" },
  { href: "/pricing", label: "Pricing" },
  { href: "/faq", label: "FAQ" },
  { href: "/book", label: "Book Now" },
  { href: "/quote", label: "Get a Quote" },
  { href: "/messages", label: "Message Us" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [location] = useLocation();

  return (
    <header className="bg-[hsl(214,60%,14%)] text-white sticky top-0 z-50 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <Link href="/" className="flex items-center gap-2.5 font-bold shrink-0">
            <img src="/logo.png" alt="Electrical Installers logo" className="h-11 sm:h-12 w-auto" />
            <span className="text-lg sm:text-xl leading-tight">Electrical<br />Installers</span>
          </Link>

          <nav className="hidden lg:flex items-center gap-0.5">
            {navLinks.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={`px-2.5 py-1.5 rounded text-sm font-medium transition-colors whitespace-nowrap ${
                  location === l.href
                    ? "bg-[hsl(25,95%,53%)] text-white"
                    : "text-gray-300 hover:text-white hover:bg-[hsl(214,50%,22%)]"
                }`}
                data-testid={`nav-${l.label.toLowerCase().replace(/\s+/g, "-")}`}
              >
                {l.label}
              </Link>
            ))}
          </nav>

          {/* Desktop click-to-call */}
          <a
            href="tel:0419868703"
            className="hidden lg:flex items-center gap-2 bg-[hsl(25,95%,53%)] hover:bg-[hsl(25,95%,45%)] text-white text-sm font-bold px-4 py-2 rounded-full transition-colors shrink-0"
            data-testid="nav-call-button"
          >
            <Phone size={14} />
            0419 868 703
          </a>

          <button
            className="lg:hidden p-2 rounded"
            onClick={() => setOpen(!open)}
            data-testid="nav-mobile-toggle"
          >
            {open ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {open && (
        <div className="lg:hidden bg-[hsl(214,60%,12%)] px-4 py-2 space-y-1">
          {navLinks.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="block px-3 py-2 rounded text-sm text-gray-300 hover:text-white hover:bg-[hsl(214,50%,22%)]"
              onClick={() => setOpen(false)}
            >
              {l.label}
            </Link>
          ))}
        </div>
      )}
    </header>
  );
}
