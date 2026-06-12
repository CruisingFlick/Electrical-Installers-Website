import { Phone, Mail, MapPin, Shield } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useRef } from "react";
import {
  LOCAL_SUBURBS,
  BUSINESS_NAME,
  BUSINESS_PHONE,
  BUSINESS_PHONE_TEL,
  BUSINESS_EMAIL,
  REC_NUMBER,
  ABN,
  LEGAL_NAME,
  SERVICE_REGION_LINE,
} from "@workspace/site-content";

export default function Footer() {
  const [, navigate] = useLocation();
  const tapCount = useRef(0);
  const tapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleSecretTap() {
    tapCount.current += 1;
    if (tapTimer.current) clearTimeout(tapTimer.current);
    if (tapCount.current >= 5) {
      tapCount.current = 0;
      navigate("/admin");
      return;
    }
    tapTimer.current = setTimeout(() => {
      tapCount.current = 0;
    }, 1500);
  }

  return (
    <footer className="bg-[hsl(214,60%,10%)] text-gray-300 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-2">
            <Link href="/" className="inline-flex items-center gap-3 mb-3 group">
              <img src="/logo.png" alt="Electrical Installers logo" className="h-14 w-auto" />
              <span className="font-bold text-white text-lg group-hover:text-[hsl(25,95%,63%)] transition-colors">{BUSINESS_NAME}</span>
            </Link>
            <p className="text-sm leading-relaxed mb-4">
              Licensed electricians serving the Mornington Peninsula and surrounding areas. Residential, commercial, industrial, and underground power specialists.
            </p>
            <div className="flex items-center gap-2 text-sm">
              <Shield size={16} className="text-[hsl(25,95%,53%)]" />
              <span>Victorian Licensed Electrical Inspector</span>
            </div>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-3">Services</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/services" className="hover:text-white transition-colors">New Homes & Renovations</Link></li>
              <li><Link href="/services" className="hover:text-white transition-colors">Commercial & Industrial</Link></li>
              <li><Link href="/services" className="hover:text-white transition-colors">3-Phase Upgrades</Link></li>
              <li><Link href="/underground-power" className="hover:text-white transition-colors">Underground Power</Link></li>
              <li><Link href="/pricing" className="hover:text-white transition-colors">Pricing Guide</Link></li>
              <li><Link href="/faq" className="hover:text-white transition-colors">FAQ</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-3">Contact</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a href={BUSINESS_PHONE_TEL} className="flex items-center gap-2 hover:text-white transition-colors">
                  <Phone size={14} className="text-[hsl(25,95%,53%)]" />
                  <span>{BUSINESS_PHONE}</span>
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Mail size={14} className="text-[hsl(25,95%,53%)]" />
                <span>{BUSINESS_EMAIL}</span>
              </li>
              <li className="flex items-start gap-2">
                <MapPin size={14} className="text-[hsl(25,95%,53%)] mt-0.5" />
                <span>{SERVICE_REGION_LINE}</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-8 border-t border-[hsl(214,40%,20%)]">
          <h3 className="text-white font-semibold mb-3">Service Areas</h3>
          <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-2 text-sm">
            {LOCAL_SUBURBS.map((s) => (
              <li key={s.slug}>
                <Link href={`/${s.slug}`} className="hover:text-white transition-colors">
                  Electrician {s.suburb}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-10 pt-6 border-t border-[hsl(214,40%,20%)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-gray-500">
          <div className="space-y-1">
            <p className="text-gray-400 font-semibold">{BUSINESS_NAME}</p>
            <p>REC Number: <span className="text-gray-400">{REC_NUMBER}</span></p>
            <p>ABN: <span className="text-gray-400">{ABN}</span></p>
            <p>
              <a href={BUSINESS_PHONE_TEL} className="hover:text-gray-300 transition-colors">{BUSINESS_PHONE}</a>
            </p>
          </div>
          <div className="text-right">
            <p>Compliant with AS/NZS 3000:2018 (Wiring Rules)</p>
            <p>ESV Licensed Electrical Contractor</p>
            <p className="mt-2 select-none" onClick={handleSecretTap}>&copy; {new Date().getFullYear()} {LEGAL_NAME}</p>
            <Link href="/privacy-policy" className="mt-1 inline-block hover:text-gray-300 transition-colors underline underline-offset-2">Privacy Policy</Link>
          </div>
        </div>
        <p className="mt-4 text-xs text-gray-600 leading-relaxed">
          {BUSINESS_NAME} is a registered business name of {LEGAL_NAME} (ABN: {ABN}). All works are covered by our Registered Electrical Contractor licence: {REC_NUMBER}. {SERVICE_REGION_LINE}.
        </p>
      </div>
    </footer>
  );
}
