import { Link } from "wouter";
import { Home, Factory, Zap, Cable, CheckCircle, ArrowRight } from "lucide-react";

const services = [
  {
    icon: Home,
    title: "New Homes & Renovations",
    description: "Whether you're building new or renovating, we handle everything from the switchboard to the last power point. We work with your builder to ensure a smooth fit-out and pass inspections first time.",
    features: ["Full wiring design and installation", "Solar-ready switchboard installation", "Safety switch (RCD) protection", "Smoke alarm compliance", "Data and communication cabling"],
    image: "https://images.unsplash.com/photo-1609779604657-fc06af861f37?w=800",
  },
  {
    icon: Factory,
    title: "Commercial & Industrial",
    description: "We understand that downtime costs money. Our commercial team works around your schedule to minimise disruption to your operations. From factory fit-outs to machinery wiring, we get it done right.",
    features: ["Factory and warehouse wiring", "Machinery installation and commissioning", "Switchboard design and installation", "Emergency lighting systems", "Compliance and safety audits"],
    image: "https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=800",
  },
  {
    icon: Zap,
    title: "3-Phase Power Upgrades",
    description: "Running a workshop, small business, or heavy equipment at home? 3-phase power gives you the capacity you need. We manage the upgrade from quote to energisation.",
    features: ["3-phase switchboard design", "Load assessment and planning", "Meter reconfiguration", "Equipment connection", "Full compliance certification"],
    image: "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=800",
  },
  {
    icon: Cable,
    title: "Underground Power",
    description: "Remove unsightly overhead power lines and improve the safety and aesthetics of your property. We manage the United Energy process from initial inspection through to final connection.",
    features: ["On-site inspection and assessment", "Site plan preparation and lodgement", "Trenching and cable installation", "Truck appointment coordination", "United Energy liaison"],
    link: "/underground-power",
    linkLabel: "Learn about the United Energy process",
  },
];

export default function ServicesPage() {
  return (
    <div>
      <div className="bg-[hsl(214,60%,14%)] text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold mb-4">Our Services</h1>
          <p className="text-gray-300 text-lg max-w-2xl">Licensed electrical work across the Mornington Peninsula and surrounding areas. Residential, commercial, and industrial.</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-20">
        {services.map((service, idx) => (
          <div
            key={service.title}
            className={`grid grid-cols-1 lg:grid-cols-2 gap-12 items-center ${idx % 2 === 1 ? "lg:flex-row-reverse" : ""}`}
            data-testid={`service-section-${service.title.toLowerCase().replace(/\s+/g, "-")}`}
          >
            <div className={idx % 2 === 1 ? "lg:order-2" : ""}>
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-[hsl(25,95%,53%)]/10 rounded-lg p-2">
                  <service.icon size={24} className="text-[hsl(25,95%,53%)]" />
                </div>
                <h2 className="text-2xl font-bold text-[hsl(214,60%,14%)]">{service.title}</h2>
              </div>
              <p className="text-gray-600 leading-relaxed mb-6">{service.description}</p>
              <ul className="space-y-2 mb-6">
                {service.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm">
                    <CheckCircle size={16} className="text-[hsl(25,95%,53%)]" />
                    {f}
                  </li>
                ))}
              </ul>
              {service.link && (
                <Link href={service.link} className="inline-flex items-center gap-2 text-[hsl(25,95%,53%)] font-semibold hover:underline">
                  {service.linkLabel} <ArrowRight size={16} />
                </Link>
              )}
            </div>
            <div className={`rounded-xl overflow-hidden shadow-md h-72 lg:h-96 bg-gray-100 ${idx % 2 === 1 ? "lg:order-1" : ""}`}>
              {service.image ? (
                <img src={service.image} alt={service.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <service.icon size={64} className="text-gray-300" />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="bg-[hsl(210,20%,96%)] py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl font-bold text-[hsl(214,60%,14%)] mb-4">Not sure what you need?</h2>
          <p className="text-gray-600 mb-8">Contact us for a free consultation. We'll assess your needs and provide an honest recommendation.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/book" className="inline-flex items-center justify-center gap-2 bg-[hsl(25,95%,53%)] text-white font-semibold px-8 py-3 rounded-lg hover:bg-[hsl(25,95%,45%)] transition-colors" data-testid="services-book-button">
              Book a Consultation
            </Link>
            <Link href="/quote" className="inline-flex items-center justify-center gap-2 border-2 border-[hsl(214,60%,14%)] text-[hsl(214,60%,14%)] font-semibold px-8 py-3 rounded-lg hover:bg-[hsl(214,60%,14%)] hover:text-white transition-colors" data-testid="services-quote-button">
              Get a Quote
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
