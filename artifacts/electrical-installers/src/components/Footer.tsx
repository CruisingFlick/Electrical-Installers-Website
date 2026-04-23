import { Zap, Phone, Mail, MapPin, Shield } from "lucide-react";
import { Link } from "wouter";

export default function Footer() {
  return (
    <footer className="bg-[hsl(214,60%,10%)] text-gray-300 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 font-bold text-white text-lg mb-3">
              <div className="bg-[hsl(25,95%,53%)] rounded p-1">
                <Zap size={18} className="text-white" />
              </div>
              Electrical Installers
            </div>
            <p className="text-sm leading-relaxed mb-4">
              Licensed electricians serving the Mornington Peninsula, St Kilda, and Warragul areas. Residential, commercial, industrial, and underground power specialists.
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
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-3">Contact</h3>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <Phone size={14} className="text-[hsl(25,95%,53%)]" />
                <span>0419 868 703</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail size={14} className="text-[hsl(25,95%,53%)]" />
                <span>info@electricalinstallers.com.au</span>
              </li>
              <li className="flex items-start gap-2">
                <MapPin size={14} className="text-[hsl(25,95%,53%)] mt-0.5" />
                <span>Mornington Peninsula | St Kilda | Warragul</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-[hsl(214,40%,20%)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-gray-500">
          <div className="space-y-1">
            <p>REC Number: <span className="text-gray-400">REC 12345</span></p>
            <p>ABN: <span className="text-gray-400">12 345 678 901</span></p>
            <p>Victorian Electrical Work Licence No. <span className="text-gray-400">EW 000001</span></p>
          </div>
          <div className="text-right">
            <p>Compliant with AS/NZS 3000:2018 (Wiring Rules)</p>
            <p>ESV Licensed Electrical Contractor</p>
            <p className="mt-2">&copy; {new Date().getFullYear()} Electrical Installers Pty Ltd</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
