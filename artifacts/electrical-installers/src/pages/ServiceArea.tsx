import { MapContainer, TileLayer, Polygon, Tooltip } from "react-leaflet";
import { useState } from "react";
import "leaflet/dist/leaflet.css";
import { MapPin, Phone, ArrowRight } from "lucide-react";
import { Link } from "wouter";

const SERVICE_AREAS = [
  {
    name: "Mornington Peninsula",
    color: "#1a3a5c",
    fillColor: "#1a3a5c",
    description: "Our home base — from Frankston to Portsea, including Mornington, Mount Eliza, Rosebud, Rye, Sorrento, Dromana, Hastings, and Somerville.",
    suburbs: "Frankston · Mornington · Mount Eliza · Rosebud · Rye · Sorrento · Dromana · Hastings · Somerville · Langwarrin · Seaford · Carrum Downs",
    polygon: [
      [-38.08, 145.12],
      [-38.08, 145.30],
      [-38.20, 145.50],
      [-38.40, 145.60],
      [-38.55, 145.50],
      [-38.60, 145.30],
      [-38.50, 145.10],
      [-38.30, 145.05],
      [-38.15, 145.08],
      [-38.08, 145.12],
    ] as [number, number][],
  },
  {
    name: "South-East Victoria",
    color: "#f97316",
    fillColor: "#f97316",
    description: "Serving St Kilda, South Yarra, Port Melbourne, Elwood, Brighton, Sandringham, and surrounding inner south suburbs.",
    suburbs: "St Kilda · South Yarra · Port Melbourne · Elwood · Brighton · Sandringham · Bentleigh · Moorabbin",
    polygon: [
      [-37.82, 144.94],
      [-37.82, 145.05],
      [-38.00, 145.08],
      [-38.05, 144.98],
      [-37.95, 144.90],
      [-37.82, 144.94],
    ] as [number, number][],
  },
  {
    name: "Warragul & Gippsland",
    color: "#15803d",
    fillColor: "#15803d",
    description: "Covering Warragul, Drouin, Pakenham, Officer, Berwick, and the western Gippsland corridor.",
    suburbs: "Warragul · Drouin · Pakenham · Officer · Berwick · Narre Warren · Cranbourne · Bunyip",
    polygon: [
      [-38.05, 145.65],
      [-38.05, 146.10],
      [-38.25, 146.20],
      [-38.35, 145.95],
      [-38.20, 145.60],
      [-38.05, 145.65],
    ] as [number, number][],
  },
];

const CENTER: [number, number] = [-38.20, 145.35];

export default function ServiceAreaPage() {
  const [activeArea, setActiveArea] = useState<string | null>(null);

  return (
    <div>
      {/* Header */}
      <div className="bg-[hsl(214,60%,14%)] text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 mb-3">
            <MapPin size={28} className="text-[hsl(25,95%,53%)]" />
            <h1 className="text-4xl font-bold">Service Areas</h1>
          </div>
          <p className="text-gray-300 text-lg max-w-2xl">
            We cover the Mornington Peninsula, Bayside/St Kilda, and Warragul/Gippsland. Click a region on the map to learn more.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="lg:grid lg:grid-cols-3 lg:gap-10">

          {/* Map */}
          <div className="lg:col-span-2 mb-10 lg:mb-0">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden" style={{ height: 520 }}>
              <MapContainer center={CENTER} zoom={9} style={{ width: "100%", height: "100%" }}>
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {SERVICE_AREAS.map((area) => (
                  <Polygon
                    key={area.name}
                    positions={area.polygon}
                    pathOptions={{
                      color: area.color,
                      fillColor: area.fillColor,
                      fillOpacity: activeArea === area.name ? 0.35 : 0.18,
                      weight: activeArea === area.name ? 3 : 2,
                    }}
                    eventHandlers={{
                      click: () => setActiveArea(area.name === activeArea ? null : area.name),
                    }}
                  >
                    <Tooltip sticky>{area.name}</Tooltip>
                  </Polygon>
                ))}
              </MapContainer>
            </div>
            <p className="text-xs text-gray-400 mt-2 text-center">Click a shaded region to see details. Coverage zones are approximate.</p>
          </div>

          {/* Area details */}
          <div className="space-y-4">
            {SERVICE_AREAS.map((area) => (
              <div
                key={area.name}
                className={`rounded-2xl border-2 p-5 cursor-pointer transition-all ${
                  activeArea === area.name
                    ? "border-[hsl(25,95%,53%)] bg-[hsl(25,95%,53%)]/5 shadow-md"
                    : "border-gray-100 bg-white hover:border-gray-200 shadow-sm"
                }`}
                onClick={() => setActiveArea(area.name === activeArea ? null : area.name)}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-4 h-4 rounded-full flex-shrink-0" style={{ backgroundColor: area.fillColor }} />
                  <h2 className="font-bold text-[hsl(214,60%,14%)]">{area.name}</h2>
                </div>
                <p className="text-sm text-gray-600 mb-2">{area.description}</p>
                {activeArea === area.name && (
                  <p className="text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2 mt-2 leading-relaxed">
                    {area.suburbs}
                  </p>
                )}
              </div>
            ))}

            {/* Not in area? */}
            <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-5">
              <p className="text-sm font-semibold text-[hsl(214,60%,14%)] mb-1">Not in these areas?</p>
              <p className="text-xs text-gray-500 mb-3">Give us a call — we may still be able to help depending on the job.</p>
              <a
                href="tel:0419868703"
                className="flex items-center gap-2 text-sm font-semibold text-[hsl(25,95%,53%)] hover:underline"
              >
                <Phone size={14} />
                0419 868 703
              </a>
            </div>

            <Link
              href="/book"
              className="flex items-center justify-center gap-2 w-full bg-[hsl(25,95%,53%)] hover:bg-[hsl(25,95%,45%)] text-white font-semibold py-3 rounded-xl transition-colors"
            >
              Book an Appointment
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>

        {/* Suburb grid */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-[hsl(214,60%,14%)] mb-8 text-center">Suburbs We Serve</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {SERVICE_AREAS.map((area) => (
              <div key={area.name} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: area.fillColor }} />
                  <h3 className="font-bold text-[hsl(214,60%,14%)]">{area.name}</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {area.suburbs.split(" · ").map((suburb) => (
                    <span key={suburb} className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full">
                      {suburb}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
