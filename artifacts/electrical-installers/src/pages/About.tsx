import { Link } from "wouter";
import {
  ShieldCheck,
  Clock,
  Star,
  MapPin,
  Phone,
  MessageSquare,
  ClipboardList,
  Wrench,
  CheckCircle,
} from "lucide-react";
import { usePageMeta } from "@/hooks/usePageMeta";

const services = [
  {
    title: "New Home Wiring",
    desc: "We work closely with builders and homeowners to wire new homes from the ground up. From roughing in to final fit-off, we make sure every circuit, outlet, and switchboard is installed to code and ready for connection.",
  },
  {
    title: "Renovations & Extensions",
    desc: "Updating your kitchen, adding a bathroom, or extending the house? We handle all the electrical work — moving circuits, upgrading power points, installing new lighting, and making sure everything meets current Australian standards.",
  },
  {
    title: "Switchboard Upgrades",
    desc: "Older switchboards with ceramic fuses are a safety risk. We upgrade to modern safety switches and circuit breakers, giving you better protection and capacity for air conditioning, EV chargers, and other high-draw appliances.",
  },
  {
    title: "3-Phase Power Upgrades",
    desc: "For homes running workshops, large air conditioning systems, or commercial-grade equipment, we install and upgrade to 3-phase power — giving you more capacity and better performance from your electrical system.",
  },
  {
    title: "Underground Power",
    desc: "We manage the full United Energy process for converting overhead power lines to underground — improving safety, removing storm damage risk, and lifting the look of your property.",
  },
  {
    title: "Commercial Wiring",
    desc: "We take on commercial projects including offices, warehouses, and retail spaces, delivering safe, compliant installations that are built to last.",
  },
  {
    title: "Fault Finding & Repairs",
    desc: "Tripping switches, flickering lights, or outlets that have stopped working — we diagnose and fix electrical faults efficiently, bringing the right equipment to find the problem fast.",
  },
];

const howWeWork = [
  {
    icon: MessageSquare,
    title: "Consulting",
    desc: "Not sure what you need or where to start? Book a consulting appointment and talk through your project with one of our electricians. We'll help you understand your options before any work begins.",
  },
  {
    icon: ClipboardList,
    title: "Quoting",
    desc: "For a firm price before committing, book a quoting appointment or submit a virtual quote online. Upload photos of your switchboard and site, and we'll come back to you with a detailed quote — often without a site visit.",
  },
  {
    icon: Wrench,
    title: "Booking Work",
    desc: "Ready to go? Book your job directly through the website, choose a preferred date, and we'll confirm within one business day.",
  },
];

const whyUs = [
  {
    icon: ShieldCheck,
    title: "Licensed & Insured",
    desc: "All work is carried out by fully licensed electricians. You get a Certificate of Electrical Safety for every job — giving you peace of mind and proof of compliance for insurers and property transactions.",
  },
  {
    icon: Clock,
    title: "On-Time, Every Time",
    desc: "We respect that your time matters. We show up when we say we will, keep you informed if anything changes, and get the job done without unnecessary delays.",
  },
  {
    icon: Star,
    title: "Transparent Pricing",
    desc: "No hidden charges. We give you a clear price before work starts and stick to it.",
  },
  {
    icon: MapPin,
    title: "Local Knowledge",
    desc: "We know the Mornington Peninsula and South-East Melbourne areas well — from older weatherboard cottages through to new coastal builds.",
  },
];

export default function AboutPage() {
  usePageMeta({
    title: "About Us | Electrical Installers",
    description: "Licensed Victorian electricians with 35 years of experience. Serving Mornington Peninsula, Bayside, and South East Melbourne. Honest, reliable, fully insured electrical contractors.",
    path: "/about",
  });
  return (
    <div>
      {/* Header */}
      <div className="bg-[hsl(214,60%,14%)] text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold mb-4">What We Offer</h1>
          <p className="text-gray-300 text-lg max-w-2xl">
            Licensed electrical work across the Mornington Peninsula and South-East Melbourne.
            Quality work, done on time, every time.
          </p>
        </div>
      </div>

      {/* Intro */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="max-w-3xl">
          <p className="text-gray-600 text-lg leading-relaxed">
            Electrical Installers is a team of fully licensed and insured electricians built around
            one simple idea: quality electrical work done on time, every time. Whether you're building
            a new home, renovating, or dealing with an electrical issue that needs sorting quickly, we
            have the experience and equipment to handle it properly.
          </p>
        </div>
      </div>

      {/* Services */}
      <div className="bg-[hsl(210,20%,98%)] py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-[hsl(214,60%,14%)] mb-10">Our Services</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((s) => (
              <div
                key={s.title}
                className="bg-white rounded-xl border border-gray-100 shadow-sm p-6"
              >
                <div className="flex items-start gap-3 mb-3">
                  <CheckCircle size={18} className="text-[hsl(25,95%,53%)] mt-0.5 flex-shrink-0" />
                  <h3 className="font-semibold text-[hsl(214,60%,14%)]">{s.title}</h3>
                </div>
                <p className="text-gray-500 text-sm leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
          <div className="mt-8">
            <Link
              href="/services"
              className="inline-flex items-center gap-2 text-[hsl(25,95%,53%)] font-semibold hover:underline text-sm"
            >
              See full service details →
            </Link>
          </div>
        </div>
      </div>

      {/* How we work */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <h2 className="text-2xl font-bold text-[hsl(214,60%,14%)] mb-3">How We Work With You</h2>
        <p className="text-gray-500 mb-10 max-w-2xl">
          We offer three ways to get started, depending on where you are in your project.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {howWeWork.map((step, i) => (
            <div
              key={step.title}
              className="relative bg-white rounded-xl border border-gray-100 shadow-sm p-6"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-full bg-[hsl(25,95%,53%)] text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
                  {i + 1}
                </div>
                <step.icon size={20} className="text-[hsl(214,60%,14%)]" />
                <h3 className="font-semibold text-[hsl(214,60%,14%)]">{step.title}</h3>
              </div>
              <p className="text-gray-500 text-sm leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Why choose us */}
      <div className="bg-[hsl(214,60%,14%)] text-white py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold mb-10">Why Customers Choose Us</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {whyUs.map((item) => (
              <div key={item.title} className="bg-white/5 rounded-xl p-6 border border-white/10">
                <item.icon size={24} className="text-[hsl(25,95%,53%)] mb-3" />
                <h3 className="font-semibold mb-2">{item.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="bg-[hsl(25,95%,53%)]/5 border border-[hsl(25,95%,53%)]/20 rounded-2xl p-8 md:p-12 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <h2 className="text-xl font-bold text-[hsl(214,60%,14%)] mb-2">Ready to get started?</h2>
            <p className="text-gray-600 text-sm max-w-lg">
              Reach us by phone on{" "}
              <a href="tel:0419868703" className="font-semibold text-[hsl(25,95%,53%)]">
                0419 868 703
              </a>{" "}
              (Monday–Friday, 7am–5pm), or submit a booking or quote request online at any time.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 flex-shrink-0">
            <Link
              href="/book"
              className="inline-flex items-center justify-center gap-2 bg-[hsl(25,95%,53%)] text-white font-semibold px-6 py-3 rounded-lg hover:bg-[hsl(25,95%,45%)] transition-colors text-sm"
            >
              Book an Appointment
            </Link>
            <a
              href="tel:0419868703"
              className="inline-flex items-center justify-center gap-2 border-2 border-[hsl(214,60%,14%)] text-[hsl(214,60%,14%)] font-semibold px-6 py-3 rounded-lg hover:bg-[hsl(214,60%,14%)] hover:text-white transition-colors text-sm"
            >
              <Phone size={15} /> Call Us
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
