import { useState, useRef, useEffect } from "react";
import { Share2, X, Phone, QrCode, Copy, Check } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

const PHONE = "0419868703";
const PHONE_DISPLAY = "0419 868 703";

export default function ShareButton() {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const siteUrl = window.location.origin + window.location.pathname;

  async function handleShare() {
    if ("share" in navigator) {
      try {
        await navigator.share({
          title: "Electrical Installers — Mornington Peninsula",
          text: "Licensed electricians serving Mornington Peninsula, St Kilda & Warragul.",
          url: siteUrl,
        });
      } catch {
        // user cancelled
      }
    } else {
      setOpen(true);
    }
  }

  async function copyLink() {
    await navigator.clipboard.writeText(siteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

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
      {/* Floating share button — desktop right side, above mobile sticky bar */}
      <button
        onClick={() => ("share" in navigator ? handleShare() : setOpen((v) => !v))}
        className="fixed right-4 bottom-20 sm:bottom-6 z-40 flex items-center gap-2 bg-[hsl(214,60%,14%)] text-white px-4 py-2.5 rounded-full shadow-lg hover:bg-[hsl(214,60%,20%)] transition-colors text-sm font-semibold"
        aria-label="Share this page"
        data-testid="share-button"
      >
        <Share2 size={16} />
        <span className="hidden sm:inline">Share</span>
      </button>

      {/* Share panel */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40">
          <div
            ref={panelRef}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 relative"
          >
            <button
              onClick={() => setOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-700"
              aria-label="Close"
            >
              <X size={20} />
            </button>

            <h2 className="text-lg font-bold text-[hsl(214,60%,14%)] mb-1">Share this page</h2>
            <p className="text-sm text-gray-500 mb-5">Scan the QR code or copy the link to share with friends.</p>

            {/* QR Code */}
            <div className="flex justify-center mb-5">
              <div className="p-3 bg-white border-2 border-[hsl(214,60%,14%)] rounded-xl">
                <QRCodeSVG
                  value={siteUrl}
                  size={160}
                  fgColor="hsl(214,60%,14%)"
                  bgColor="#ffffff"
                  level="M"
                />
              </div>
            </div>

            {/* URL copy */}
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 mb-4">
              <span className="flex-1 text-xs text-gray-600 truncate">{siteUrl}</span>
              <button
                onClick={copyLink}
                className="shrink-0 flex items-center gap-1 text-xs font-semibold text-[hsl(214,60%,14%)] hover:text-[hsl(25,95%,53%)] transition-colors"
                data-testid="copy-link-button"
              >
                {copied ? <><Check size={14} className="text-green-500" /> Copied!</> : <><Copy size={14} /> Copy</>}
              </button>
            </div>

            {/* Call us */}
            <a
              href={`tel:${PHONE}`}
              className="flex items-center justify-center gap-2 w-full bg-[hsl(25,95%,53%)] text-white font-bold py-3 rounded-xl hover:bg-[hsl(25,95%,45%)] transition-colors"
            >
              <Phone size={18} />
              Call Us — {PHONE_DISPLAY}
            </a>
          </div>
        </div>
      )}
    </>
  );
}
