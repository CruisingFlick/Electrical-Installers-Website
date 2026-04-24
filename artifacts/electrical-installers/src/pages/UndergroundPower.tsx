import { Link } from "wouter";
import { ClipboardList, FileText, Clock, Shovel, Truck, AlertTriangle, ArrowRight, CheckCircle } from "lucide-react";

const steps = [
  {
    icon: ClipboardList,
    step: "1",
    title: "On-Site Inspection",
    description: "One of our licensed electricians visits your property to assess the current overhead service, measure distances, identify the Point of Attachment (fascia), and determine the best cable route to the street pit.",
    duration: "1-2 hours",
  },
  {
    icon: FileText,
    step: "2",
    title: "UE Application & Site Plan (UE-PR-0719)",
    description: "We prepare a detailed site plan showing the proposed underground cable route, pit locations, and service entry point. This is lodged with United Energy using form UE-PR-0719 for approval and quotation.",
    duration: "1-3 days to prepare",
  },
  {
    icon: Clock,
    step: "3",
    title: "United Energy Quote Window",
    description: "United Energy assesses the site plan and provides their quote for the network connection work. This process takes up to 20 business days by law. The UE quote covers their network assets only — your private trenching and cabling is separate.",
    duration: "Up to 20 business days",
  },
  {
    icon: Shovel,
    step: "4",
    title: "30-Day Install Window & Private Mains",
    description: "Once you accept all quotes, United Energy schedules the work within a 30-day install window. During this time we complete the private mains installation — trenching your property, laying the underground conduit and service cable from the street pit to your meter box to AS/NZS 3000 standard.",
    duration: "30-day window; site work 1-3 days",
  },
  {
    icon: Truck,
    step: "5",
    title: "Truck Appointment & Safety Inspection",
    description: "United Energy attends to connect the new underground service to the network, remove the overhead lines, and energise your property. We attend this appointment to manage the cutover and conduct the final safety inspection before sign-off.",
    duration: "Half day",
  },
];

export default function UndergroundPowerPage() {
  return (
    <div>
      <div className="bg-[hsl(214,60%,14%)] text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold mb-4">Underground Power</h1>
          <p className="text-gray-300 text-lg max-w-2xl">Remove overhead power lines and go underground. We manage the full United Energy process from inspection to connection.</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 mb-12 flex items-start gap-4">
          <AlertTriangle size={24} className="text-amber-600 shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-amber-900 mb-1">Important Disclaimer</h3>
            <p className="text-sm text-amber-800 leading-relaxed">
              The cost of underground power involves two separate components: our electrical contractor fees (for site work, trenching, and cabling) and <strong>United Energy's network fees</strong> (for their infrastructure and connection work). The United Energy fees are set by them and are separate to our quote. Your electricity retailer may also have associated fees. We will provide a full breakdown of all expected costs before any work commences.
            </p>
          </div>
        </div>

        <h2 className="text-2xl font-bold text-[hsl(214,60%,14%)] mb-8">The United Energy Process</h2>

        <div className="relative">
          <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200 hidden sm:block" />
          <div className="space-y-8">
            {steps.map((step) => (
              <div key={step.step} className="relative flex gap-6" data-testid={`process-step-${step.step}`}>
                <div className="shrink-0 w-12 h-12 rounded-full bg-[hsl(214,60%,14%)] text-white flex items-center justify-center font-bold text-lg z-10">
                  {step.step}
                </div>
                <div className="flex-1 bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="bg-[hsl(25,95%,53%)]/10 rounded-lg p-2">
                        <step.icon size={20} className="text-[hsl(25,95%,53%)]" />
                      </div>
                      <h3 className="font-semibold text-lg text-[hsl(214,60%,14%)]">{step.title}</h3>
                    </div>
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded whitespace-nowrap">{step.duration}</span>
                  </div>
                  <p className="text-gray-600 leading-relaxed">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-12 bg-[hsl(214,60%,14%)] text-white rounded-xl p-8">
          <h3 className="text-xl font-bold mb-4">What You Need to Provide</h3>
          <ul className="space-y-2">
            {[
              "Access to the property for the site inspection",
              "Approval from your local council if any public land is involved in the trenching route",
              "DIAL Before You Dig clearance (we can assist with this)",
              "Decision on whether you want to coordinate your own trenching or have us arrange it",
            ].map((item) => (
              <li key={item} className="flex items-start gap-2 text-sm">
                <CheckCircle size={16} className="text-[hsl(25,95%,53%)] shrink-0 mt-0.5" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-8 text-center">
          <p className="text-gray-600 mb-6">Ready to get started? Submit a virtual quote or book a consultation.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/quote" className="inline-flex items-center justify-center gap-2 bg-[hsl(25,95%,53%)] text-white font-semibold px-8 py-3 rounded-lg hover:bg-[hsl(25,95%,45%)] transition-colors" data-testid="underground-quote-button">
              Submit a Quote Request <ArrowRight size={16} />
            </Link>
            <Link href="/book" className="inline-flex items-center justify-center gap-2 border-2 border-[hsl(214,60%,14%)] text-[hsl(214,60%,14%)] font-semibold px-8 py-3 rounded-lg hover:bg-gray-50 transition-colors" data-testid="underground-book-button">
              Book Inspection
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
