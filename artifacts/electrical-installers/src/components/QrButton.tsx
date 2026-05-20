import { useState, useRef, useEffect } from "react";
import { QrCode, X, Phone, Globe } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

const PHONE = "0419868703";
const PHONE_DISPLAY = "0419 868 703";

export default function QrButton() {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const siteUrl = window.location.origin;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <>
      <button
        onClick={() => setOpen((v) => !v)}
        className="fixed right-4 bottom-36 sm:bottom-[88px] z-40 flex items-center gap-2 bg-white text-[hsl(214,60%,14%)] border border-gray-200 px-4 py-2.5 rounded-full shadow-lg hover:bg-gray-50 transition-colors text-sm font-semibold"
        aria-label="Show QR code"
        data-testid="qr-button"
      >
        <QrCode size={16} />
        <span className="hidden sm:inline">QR Code</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40">
          <div
            ref={panelRef}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-xs p-6 relative"
          >
            <button
              onClick={() => setOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-700"
              aria-label="Close"
            >
              <X size={20} />
            </button>

            <h2 className="text-base font-bold text-[hsl(214,60%,14%)] mb-1 text-center">
              Open on your phone
            </h2>
            <p className="text-xs text-gray-400 text-center mb-5">
              Scan with your camera to visit the site or tap to call
            </p>

            {/* QR Code — encodes the site URL */}
            <div className="flex justify-center mb-5">
              <div className="p-3 bg-white border-2 border-[hsl(214,60%,14%)] rounded-xl">
                <QRCodeSVG
                  value={siteUrl}
                  size={180}
                  fgColor="hsl(214,60%,14%)"
                  bgColor="#ffffff"
                  level="M"
                  imageSettings={{
                    src: "/favicon.svg",
                    height: 28,
                    width: 28,
                    excavate: true,
                  }}
                />
              </div>
            </div>

            {/* Label below QR */}
            <div className="flex items-center justify-center gap-1.5 text-xs text-gray-500 mb-5">
              <Globe size={13} />
              <span className="font-medium truncate">{siteUrl.replace(/^https?:\/\//, "")}</span>
            </div>

            {/* Divider */}
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 h-px bg-gray-100" />
              <span className="text-xs text-gray-400">or call us directly</span>
              <div className="flex-1 h-px bg-gray-100" />
            </div>

            {/* Call button */}
            <a
              href={`tel:${PHONE}`}
              className="flex items-center justify-center gap-2 w-full bg-[hsl(25,95%,53%)] text-white font-bold py-3 rounded-xl hover:bg-[hsl(25,95%,45%)] transition-colors text-sm"
            >
              <Phone size={17} />
              {PHONE_DISPLAY}
            </a>
          </div>
        </div>
      )}
    </>
  );
}
