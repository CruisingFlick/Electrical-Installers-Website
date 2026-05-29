import { useState, useRef, useEffect } from "react";
import { QrCode, X, Phone, Globe, UserPlus, Smartphone, Apple } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

const PHONE = "0419868703";
const PHONE_DISPLAY = "0419 868 703";
const EMAIL = "info@electricalinstallers.com.au";
const BUSINESS_NAME = "Electrical Installers";

const VCARD = [
  "BEGIN:VCARD",
  "VERSION:3.0",
  `FN:${BUSINESS_NAME}`,
  `ORG:${BUSINESS_NAME}`,
  `TEL;TYPE=CELL:+61${PHONE.slice(1)}`,
  `EMAIL:${EMAIL}`,
  "ADR:;;Mornington Peninsula;;VIC;;Australia",
  "NOTE:Licensed electricians — Mornington Peninsula\\, St Kilda & Warragul. REC 25510.",
  "END:VCARD",
].join("\n");

type Tab = "website" | "contact" | "app";

export default function QrButton() {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<Tab>("website");
  const [isIos, setIsIos] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const siteUrl = window.location.origin;

  useEffect(() => {
    setIsIos(/iphone|ipad|ipod/i.test(navigator.userAgent));
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "website", label: "Website", icon: <Globe size={13} /> },
    { id: "contact", label: "Contact", icon: <UserPlus size={13} /> },
    { id: "app", label: "Add to Phone", icon: <Smartphone size={13} /> },
  ];

  return (
    <>
      <button
        onClick={() => setOpen((v) => !v)}
        className="fixed right-4 bottom-36 sm:bottom-[88px] z-40 flex items-center gap-2 bg-white text-[hsl(214,60%,14%)] border border-gray-200 px-4 py-2.5 rounded-full shadow-lg hover:bg-gray-50 transition-colors text-sm font-semibold"
        aria-label="Show QR code"
        data-testid="qr-button"
      >
        <QrCode size={16} />
        <span>Share with your phone</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40">
          <div
            ref={panelRef}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-sm relative overflow-hidden"
          >
            {/* Header */}
            <div className="px-6 pt-5 pb-4 border-b border-gray-100">
              <button
                onClick={() => setOpen(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-700"
                aria-label="Close"
              >
                <X size={20} />
              </button>
              <h2 className="text-base font-bold text-[hsl(214,60%,14%)]">Share with your phone</h2>
              <p className="text-xs text-gray-400 mt-0.5">Scan or share — choose what you need below</p>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-100">
              {tabs.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold transition-colors ${
                    tab === t.id
                      ? "text-[hsl(214,60%,14%)] border-b-2 border-[hsl(25,95%,53%)]"
                      : "text-gray-400 hover:text-gray-600"
                  }`}
                >
                  {t.icon}
                  {t.label}
                </button>
              ))}
            </div>

            <div className="px-6 py-5">
              {/* ── WEBSITE TAB ── */}
              {tab === "website" && (
                <>
                  <p className="text-xs text-gray-400 text-center mb-4">
                    Scan with your camera to open the website on your phone
                  </p>
                  <div className="flex justify-center mb-4">
                    <div className="p-3 bg-white border-2 border-[hsl(214,60%,14%)] rounded-xl">
                      <QRCodeSVG
                        value={siteUrl}
                        size={180}
                        fgColor="hsl(214,60%,14%)"
                        bgColor="#ffffff"
                        level="M"
                        imageSettings={{
                          src: "/favicon.png",
                          height: 26,
                          width: 26,
                          excavate: true,
                        }}
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-center gap-1.5 text-xs text-gray-400 mb-5">
                    <Globe size={12} />
                    <span className="truncate">{siteUrl.replace(/^https?:\/\//, "")}</span>
                  </div>
                  <a
                    href={`tel:${PHONE}`}
                    className="flex items-center justify-center gap-2 w-full bg-[hsl(25,95%,53%)] text-white font-bold py-3 rounded-xl hover:bg-[hsl(25,95%,45%)] transition-colors text-sm"
                  >
                    <Phone size={16} />
                    Call — {PHONE_DISPLAY}
                  </a>
                </>
              )}

              {/* ── CONTACT TAB ── */}
              {tab === "contact" && (
                <>
                  <p className="text-xs text-gray-400 text-center mb-4">
                    Scan to save Electrical Installers straight to your contacts — name, phone, email & website all in one
                  </p>
                  <div className="flex justify-center mb-4">
                    <div className="p-3 bg-white border-2 border-[hsl(214,60%,14%)] rounded-xl">
                      <QRCodeSVG
                        value={VCARD}
                        size={180}
                        fgColor="hsl(214,60%,14%)"
                        bgColor="#ffffff"
                        level="M"
                      />
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3 mb-5 text-xs text-gray-600 space-y-1.5">
                    <div className="flex gap-2"><span className="font-semibold w-14 shrink-0">Name</span><span>{BUSINESS_NAME}</span></div>
                    <div className="flex gap-2"><span className="font-semibold w-14 shrink-0">Phone</span><span>{PHONE_DISPLAY}</span></div>
                    <div className="flex gap-2"><span className="font-semibold w-14 shrink-0">Email</span><span className="truncate">{EMAIL}</span></div>
                    <div className="flex gap-2"><span className="font-semibold w-14 shrink-0">Web</span><span className="truncate">{siteUrl.replace(/^https?:\/\//, "")}</span></div>
                  </div>
                  <a
                    href={`tel:${PHONE}`}
                    className="flex items-center justify-center gap-2 w-full bg-[hsl(25,95%,53%)] text-white font-bold py-3 rounded-xl hover:bg-[hsl(25,95%,45%)] transition-colors text-sm"
                  >
                    <Phone size={16} />
                    Call — {PHONE_DISPLAY}
                  </a>
                </>
              )}

              {/* ── ADD TO PHONE TAB ── */}
              {tab === "app" && (
                <>
                  <p className="text-xs text-gray-400 text-center mb-5">
                    Add this website to your phone's home screen — it works just like an app, with a shortcut icon for instant access
                  </p>

                  {/* iOS instructions */}
                  <div className={`rounded-xl border p-4 mb-3 ${isIos ? "border-[hsl(214,60%,14%)] bg-blue-50" : "border-gray-100 bg-gray-50"}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <Apple size={15} className="text-[hsl(214,60%,14%)]" />
                      <span className="text-xs font-bold text-[hsl(214,60%,14%)]">iPhone / iPad (Safari)</span>
                      {isIos && <span className="ml-auto text-[10px] bg-[hsl(25,95%,53%)] text-white rounded-full px-2 py-0.5 font-semibold">Your device</span>}
                    </div>
                    <ol className="text-xs text-gray-600 space-y-1 list-none">
                      <li>1. Open this site in <strong>Safari</strong></li>
                      <li>2. Tap the <strong>Share</strong> button <span className="inline-block bg-gray-200 rounded px-1">⬆</span> at the bottom</li>
                      <li>3. Scroll down and tap <strong>"Add to Home Screen"</strong></li>
                      <li>4. Tap <strong>Add</strong> — done!</li>
                    </ol>
                  </div>

                  {/* Android instructions */}
                  <div className={`rounded-xl border p-4 mb-4 ${!isIos ? "border-[hsl(214,60%,14%)] bg-blue-50" : "border-gray-100 bg-gray-50"}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <Smartphone size={15} className="text-[hsl(214,60%,14%)]" />
                      <span className="text-xs font-bold text-[hsl(214,60%,14%)]">Android (Chrome)</span>
                      {!isIos && <span className="ml-auto text-[10px] bg-[hsl(25,95%,53%)] text-white rounded-full px-2 py-0.5 font-semibold">Your device</span>}
                    </div>
                    <ol className="text-xs text-gray-600 space-y-1 list-none">
                      <li>1. Open this site in <strong>Chrome</strong></li>
                      <li>2. Tap the <strong>⋮ menu</strong> (top right)</li>
                      <li>3. Tap <strong>"Add to Home screen"</strong> or <strong>"Install app"</strong></li>
                      <li>4. Tap <strong>Add</strong> — done!</li>
                    </ol>
                  </div>

                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex-1 h-px bg-gray-100" />
                    <span className="text-xs text-gray-400">or scan to open first</span>
                    <div className="flex-1 h-px bg-gray-100" />
                  </div>

                  <div className="flex justify-center mb-4">
                    <div className="p-2.5 bg-white border-2 border-[hsl(214,60%,14%)] rounded-xl">
                      <QRCodeSVG
                        value={siteUrl}
                        size={120}
                        fgColor="hsl(214,60%,14%)"
                        bgColor="#ffffff"
                        level="M"
                      />
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
