import { useState, useRef, useEffect } from "react";
import { QrCode, X, Phone, Globe, UserPlus, Smartphone, Apple, Share2, Download, Plus, Copy, Check, Mail, MessageSquare } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

const PHONE = "0419868703";
const PHONE_DISPLAY = "0419 868 703";
const EMAIL = "info@electricalinstallers.com.au";
const BUSINESS_NAME = "Electrical Installers";
const SITE_TITLE = "Electrical Installers — Mornington Peninsula Electricians";
const SITE_DESC = "Licensed electricians serving Mornington Peninsula, St Kilda & Warragul. Call 0419 868 703.";

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

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function QrButton() {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<Tab>("website");
  const [isIos, setIsIos] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [canShare, setCanShare] = useState(false);
  const [copied, setCopied] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const siteUrl = "https://electricalinstallers.com.au";

  useEffect(() => {
    const ua = navigator.userAgent;
    const ios = /iphone|ipad|ipod/i.test(ua);
    const mobile = /iphone|ipad|ipod|android/i.test(ua);
    setIsIos(ios);
    setIsMobile(mobile);
    setCanShare(!!navigator.share);

    const handler = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);

    window.addEventListener("appinstalled", () => setInstalled(true));

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
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
    { id: "contact", label: "Save Contact", icon: <UserPlus size={13} /> },
    { id: "app", label: "Add to Phone", icon: <Smartphone size={13} /> },
  ];

  async function handleNativeShare() {
    if (navigator.share) {
      try {
        await navigator.share({ title: SITE_TITLE, text: SITE_DESC, url: siteUrl });
      } catch {
        // user dismissed — that's fine
      }
    }
  }

  function handleShareViaText() {
    const msg = encodeURIComponent(`${SITE_TITLE}\n${siteUrl}`);
    window.open(`sms:?body=${msg}`, "_self");
  }

  function handleShareViaEmail() {
    const subject = encodeURIComponent(SITE_TITLE);
    const body = encodeURIComponent(`${SITE_DESC}\n\n${siteUrl}`);
    window.open(`mailto:?subject=${subject}&body=${body}`, "_self");
  }

  async function handleCopyLink() {
    try {
      await navigator.clipboard.writeText(siteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback: select text
    }
  }

  function handleDownloadContact() {
    const blob = new Blob([VCARD], { type: "text/vcard" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "electrical-installers.vcf";
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleAddToPhone() {
    if (installPrompt) {
      await installPrompt.prompt();
      const { outcome } = await installPrompt.userChoice;
      if (outcome === "accepted") {
        setInstalled(true);
        setInstallPrompt(null);
      }
    } else if (isIos && navigator.share) {
      await navigator.share({ title: SITE_TITLE, url: siteUrl });
    }
  }

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
                    {isMobile ? "Share this website or scan the QR code on another device" : "Scan with your phone camera to open the website"}
                  </p>

                  <div className="flex justify-center mb-4">
                    <div className="p-3 bg-white border-2 border-[hsl(214,60%,14%)] rounded-xl">
                      <QRCodeSVG
                        value={siteUrl}
                        size={160}
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

                  <div className="flex items-center justify-center gap-1.5 text-xs text-gray-400 mb-4">
                    <Globe size={12} />
                    <span className="truncate">{siteUrl.replace(/^https?:\/\//, "")}</span>
                  </div>

                  {/* Share buttons */}
                  <div className="space-y-2 mb-4">
                    {canShare && (
                      <button
                        onClick={handleNativeShare}
                        className="flex items-center justify-center gap-2 w-full bg-[hsl(214,60%,14%)] text-white font-bold py-3 rounded-xl hover:opacity-90 transition-opacity text-sm"
                      >
                        <Share2 size={16} />
                        Share this website
                      </button>
                    )}

                    <div className="grid grid-cols-3 gap-2">
                      <button
                        onClick={handleShareViaText}
                        className="flex flex-col items-center justify-center gap-1 py-3 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors text-xs text-gray-600 font-medium"
                      >
                        <MessageSquare size={18} className="text-[hsl(214,60%,14%)]" />
                        Text
                      </button>
                      <button
                        onClick={handleShareViaEmail}
                        className="flex flex-col items-center justify-center gap-1 py-3 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors text-xs text-gray-600 font-medium"
                      >
                        <Mail size={18} className="text-[hsl(214,60%,14%)]" />
                        Email
                      </button>
                      <button
                        onClick={handleCopyLink}
                        className="flex flex-col items-center justify-center gap-1 py-3 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors text-xs font-medium"
                      >
                        {copied ? (
                          <>
                            <Check size={18} className="text-green-500" />
                            <span className="text-green-500">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy size={18} className="text-[hsl(214,60%,14%)]" />
                            <span className="text-gray-600">Copy link</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Quick links to other tabs */}
                  <div className="grid grid-cols-2 gap-2 pt-3 border-t border-gray-100">
                    <button
                      onClick={() => setTab("app")}
                      className="flex items-center justify-center gap-1.5 py-2 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors text-xs text-gray-600 font-medium"
                    >
                      <Plus size={13} />
                      Add to phone
                    </button>
                    <button
                      onClick={() => setTab("contact")}
                      className="flex items-center justify-center gap-1.5 py-2 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors text-xs text-gray-600 font-medium"
                    >
                      <UserPlus size={13} />
                      Save contact
                    </button>
                  </div>
                </>
              )}

              {/* ── CONTACT TAB ── */}
              {tab === "contact" && (
                <>
                  <p className="text-xs text-gray-400 text-center mb-4">
                    Save Electrical Installers to your contacts — name, phone, email & website all in one tap
                  </p>

                  {/* Download button — most reliable on mobile */}
                  <button
                    onClick={handleDownloadContact}
                    className="flex items-center justify-center gap-2 w-full bg-[hsl(214,60%,14%)] text-white font-bold py-3 rounded-xl hover:opacity-90 transition-opacity text-sm mb-4"
                  >
                    <Download size={16} />
                    Save to Contacts
                  </button>

                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex-1 h-px bg-gray-100" />
                    <span className="text-xs text-gray-400">or scan on another device</span>
                    <div className="flex-1 h-px bg-gray-100" />
                  </div>

                  <div className="flex justify-center mb-4">
                    <div className="p-3 bg-white border-2 border-[hsl(214,60%,14%)] rounded-xl">
                      <QRCodeSVG
                        value={VCARD}
                        size={150}
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
                  <p className="text-xs text-gray-400 text-center mb-4">
                    Add a shortcut icon to your home screen — opens instantly like an app
                  </p>

                  {/* Android: actual install prompt */}
                  {installPrompt && !installed && (
                    <button
                      onClick={handleAddToPhone}
                      className="flex items-center justify-center gap-2 w-full bg-[hsl(214,60%,14%)] text-white font-bold py-4 rounded-xl hover:opacity-90 transition-opacity text-sm mb-4"
                    >
                      <Plus size={18} />
                      Add to Home Screen
                    </button>
                  )}

                  {installed && (
                    <div className="flex items-center justify-center gap-2 w-full bg-green-50 text-green-700 font-bold py-4 rounded-xl text-sm mb-4 border border-green-200">
                      <Check size={18} />
                      Added to your home screen!
                    </div>
                  )}

                  {/* iOS: share sheet contains "Add to Home Screen" */}
                  {isIos && !installPrompt && (
                    <>
                      <button
                        onClick={handleAddToPhone}
                        className="flex items-center justify-center gap-2 w-full bg-[hsl(214,60%,14%)] text-white font-bold py-4 rounded-xl hover:opacity-90 transition-opacity text-sm mb-4"
                      >
                        <Share2 size={18} />
                        Open Share Menu
                      </button>
                      <div className="bg-blue-50 rounded-xl border border-blue-100 p-3 mb-4">
                        <p className="text-xs text-gray-600 text-center">
                          In the share menu, tap <strong>"Add to Home Screen"</strong> then tap <strong>Add</strong>
                        </p>
                      </div>
                    </>
                  )}

                  {/* Desktop or Android without prompt yet */}
                  {!isIos && !installPrompt && !installed && (
                    <>
                      <div className={`rounded-xl border p-4 mb-3 border-[hsl(214,60%,14%)] bg-blue-50`}>
                        <div className="flex items-center gap-2 mb-2">
                          <Apple size={15} className="text-[hsl(214,60%,14%)]" />
                          <span className="text-xs font-bold text-[hsl(214,60%,14%)]">iPhone / iPad</span>
                        </div>
                        <ol className="text-xs text-gray-600 space-y-1 list-none">
                          <li>1. Open this site in <strong>Safari</strong></li>
                          <li>2. Tap the <strong>Share</strong> button <span className="inline-block bg-gray-200 rounded px-1">⬆</span> at the bottom</li>
                          <li>3. Tap <strong>"Add to Home Screen"</strong></li>
                          <li>4. Tap <strong>Add</strong> — done!</li>
                        </ol>
                      </div>

                      <div className="rounded-xl border p-4 mb-4 border-gray-100 bg-gray-50">
                        <div className="flex items-center gap-2 mb-2">
                          <Smartphone size={15} className="text-[hsl(214,60%,14%)]" />
                          <span className="text-xs font-bold text-[hsl(214,60%,14%)]">Android (Chrome)</span>
                        </div>
                        <ol className="text-xs text-gray-600 space-y-1 list-none">
                          <li>1. Open this site in <strong>Chrome</strong></li>
                          <li>2. Tap the <strong>⋮ menu</strong> (top right)</li>
                          <li>3. Tap <strong>"Add to Home screen"</strong></li>
                          <li>4. Tap <strong>Add</strong> — done!</li>
                        </ol>
                      </div>
                    </>
                  )}

                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex-1 h-px bg-gray-100" />
                    <span className="text-xs text-gray-400">scan to open on your phone first</span>
                    <div className="flex-1 h-px bg-gray-100" />
                  </div>

                  <div className="flex justify-center">
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
