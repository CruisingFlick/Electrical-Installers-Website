import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Smartphone, Apple, Share2, Plus, Check, Zap, ArrowRight, Phone } from "lucide-react";
import { BUSINESS_NAME, BUSINESS_PHONE, BUSINESS_PHONE_TEL, SITE_URL } from "@workspace/site-content";
import { usePageMeta } from "@/hooks/usePageMeta";

const SITE_TITLE = "Electrical Installers — Mornington Peninsula Electricians";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function GetAppPage() {
  usePageMeta({
    title: "Add Our App to Your Phone | Electrical Installers",
    description: "Add the Electrical Installers app to your phone's home screen — one tap to call, book and track your electrician on the Mornington Peninsula.",
    path: "/get-app",
  });

  const [isIos, setIsIos] = useState(false);
  const [canShare, setCanShare] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    const ua = navigator.userAgent;
    setIsIos(/iphone|ipad|ipod/i.test(ua));
    setCanShare(!!navigator.share);

    // Already installed / running as an installed app?
    const standalone =
      window.matchMedia?.("(display-mode: standalone)").matches ||
      (navigator as unknown as { standalone?: boolean }).standalone === true;
    if (standalone) setInstalled(true);

    const promptHandler = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
    };
    const installedHandler = () => setInstalled(true);
    window.addEventListener("beforeinstallprompt", promptHandler);
    window.addEventListener("appinstalled", installedHandler);

    return () => {
      window.removeEventListener("beforeinstallprompt", promptHandler);
      window.removeEventListener("appinstalled", installedHandler);
    };
  }, []);

  async function handleAddToPhone() {
    try {
      if (installPrompt) {
        await installPrompt.prompt();
        const { outcome } = await installPrompt.userChoice;
        if (outcome === "accepted") {
          setInstalled(true);
          setInstallPrompt(null);
        }
      } else if (isIos && navigator.share) {
        await navigator.share({ title: SITE_TITLE, url: SITE_URL });
      }
    } catch {
      // user dismissed the prompt / share sheet — nothing to do
    }
  }

  return (
    <div className="bg-[hsl(210,20%,98%)] min-h-screen">
      {/* Hero */}
      <section className="bg-[hsl(214,60%,14%)] text-white">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[hsl(25,95%,53%)] mb-5">
            <Zap size={30} />
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold mb-3">Add {BUSINESS_NAME} to your phone</h1>
          <p className="text-gray-300 text-base leading-relaxed">
            One tap on your home screen to call, book, and track your electrician — opens instantly, just like an app. No app store needed.
          </p>
        </div>
      </section>

      <div className="max-w-md mx-auto px-4 sm:px-6 py-8">
        {/* Confirmed installed */}
        {installed && (
          <div className="flex items-center justify-center gap-2 w-full bg-green-50 text-green-700 font-bold py-4 rounded-xl text-sm mb-6 border border-green-200">
            <Check size={18} />
            Added to your home screen!
          </div>
        )}

        {/* Android / supported browsers: real install prompt */}
        {installPrompt && !installed && (
          <button
            onClick={handleAddToPhone}
            className="flex items-center justify-center gap-2 w-full bg-[hsl(25,95%,53%)] text-white font-bold py-4 rounded-xl hover:bg-[hsl(25,95%,45%)] transition-colors text-base mb-6"
          >
            <Plus size={20} />
            Add to Home Screen
          </button>
        )}

        {/* iOS: open share sheet */}
        {isIos && !installPrompt && !installed && (
          <>
            {canShare && (
              <button
                onClick={handleAddToPhone}
                className="flex items-center justify-center gap-2 w-full bg-[hsl(25,95%,53%)] text-white font-bold py-4 rounded-xl hover:bg-[hsl(25,95%,45%)] transition-colors text-base mb-4"
              >
                <Share2 size={20} />
                Open Share Menu
              </button>
            )}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-6">
              <div className="flex items-center gap-2 mb-3">
                <Apple size={18} className="text-[hsl(214,60%,14%)]" />
                <span className="font-bold text-[hsl(214,60%,14%)]">On your iPhone / iPad</span>
              </div>
              <ol className="text-sm text-gray-600 space-y-2 list-none">
                <li>1. Tap the <strong>Share</strong> button <span className="inline-block bg-gray-100 rounded px-1.5">⬆</span> at the bottom of Safari</li>
                <li>2. Scroll down and tap <strong>"Add to Home Screen"</strong></li>
                <li>3. Tap <strong>Add</strong> — done!</li>
              </ol>
            </div>
          </>
        )}

        {/* Desktop or Android before prompt is ready: show both sets of steps */}
        {!isIos && !installPrompt && !installed && (
          <>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-4">
              <div className="flex items-center gap-2 mb-3">
                <Smartphone size={18} className="text-[hsl(214,60%,14%)]" />
                <span className="font-bold text-[hsl(214,60%,14%)]">Android (Chrome)</span>
              </div>
              <ol className="text-sm text-gray-600 space-y-2 list-none">
                <li>1. Tap the <strong>⋮ menu</strong> (top right)</li>
                <li>2. Tap <strong>"Add to Home screen"</strong></li>
                <li>3. Tap <strong>Add</strong> — done!</li>
              </ol>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-6">
              <div className="flex items-center gap-2 mb-3">
                <Apple size={18} className="text-[hsl(214,60%,14%)]" />
                <span className="font-bold text-[hsl(214,60%,14%)]">iPhone / iPad (Safari)</span>
              </div>
              <ol className="text-sm text-gray-600 space-y-2 list-none">
                <li>1. Tap the <strong>Share</strong> button <span className="inline-block bg-gray-100 rounded px-1.5">⬆</span> at the bottom</li>
                <li>2. Tap <strong>"Add to Home Screen"</strong></li>
                <li>3. Tap <strong>Add</strong> — done!</li>
              </ol>
            </div>
          </>
        )}

        {/* Always-available quick actions */}
        <div className="grid grid-cols-1 gap-3">
          <a
            href={BUSINESS_PHONE_TEL}
            className="flex items-center justify-center gap-2 w-full bg-[hsl(214,60%,14%)] text-white font-bold py-3.5 rounded-xl hover:opacity-90 transition-opacity text-sm"
          >
            <Phone size={16} />
            Call us — {BUSINESS_PHONE}
          </a>
          <Link
            href="/book"
            className="flex items-center justify-center gap-2 w-full border-2 border-gray-200 text-[hsl(214,60%,14%)] font-semibold py-3.5 rounded-xl hover:bg-white transition-colors text-sm"
          >
            Book a job
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </div>
  );
}
