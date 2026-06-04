import { useState, useEffect } from "react";
import AdminLayout from "./AdminLayout";
import { Settings, ExternalLink, CheckCircle, Save, AlertCircle, Star } from "lucide-react";

type SiteSettings = {
  googleReviewsUrl: string;
};

export default function AdminSiteSettings() {
  const [settings, setSettings] = useState<SiteSettings>({ googleReviewsUrl: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/settings", { credentials: "same-origin" })
      .then((r) => r.json())
      .then((data: SiteSettings) => setSettings(data))
      .catch(() => setError("Failed to load settings"))
      .finally(() => setLoading(false));
  }, []);

  async function handleSave() {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (!res.ok) throw new Error("Failed to save");
      const data = await res.json() as SiteSettings;
      setSettings(data);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      setError("Failed to save settings. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  const inputClass = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(25,95%,53%)]";

  return (
    <AdminLayout>
      <div className="max-w-2xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-[hsl(214,60%,14%)] rounded-lg">
            <Settings size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[hsl(214,60%,14%)]">Site Settings</h1>
            <p className="text-sm text-gray-500">Configure public-facing links and integrations.</p>
          </div>
        </div>

        {loading ? (
          <div className="space-y-3">{[1, 2].map((i) => <div key={i} className="bg-gray-100 h-20 rounded-xl animate-pulse" />)}</div>
        ) : (
          <div className="space-y-6">
            {error && (
              <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                <AlertCircle size={15} className="shrink-0 mt-0.5" />
                {error}
              </div>
            )}

            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
              <div className="flex items-center gap-2 mb-4">
                <Star size={18} className="text-[hsl(25,95%,53%)]" />
                <h2 className="text-base font-bold text-[hsl(214,60%,14%)]">Google Reviews</h2>
              </div>

              <p className="text-sm text-gray-600 mb-4">
                Paste your Google Business Profile review link here. It will appear as a "Leave a Google Review" button on the Reviews page, making it easy for happy customers to review you publicly.
              </p>

              <div className="space-y-2 mb-4">
                <label className="block text-sm font-medium text-gray-700">Google Review Link</label>
                <input
                  type="url"
                  value={settings.googleReviewsUrl}
                  onChange={(e) => setSettings((s) => ({ ...s, googleReviewsUrl: e.target.value }))}
                  className={inputClass}
                  placeholder="https://g.page/r/..."
                  data-testid="input-google-reviews-url"
                />
                <p className="text-xs text-gray-400">
                  To find this: Go to Google Maps → search your business → click "Get more reviews" → copy the link.
                  Or from Google Business Profile dashboard → "Share review form".
                </p>
              </div>

              {settings.googleReviewsUrl && (
                <a
                  href={settings.googleReviewsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-[hsl(25,95%,53%)] hover:underline"
                >
                  <ExternalLink size={12} />
                  Test this link
                </a>
              )}
            </div>

            <div className="flex justify-end">
              <button
                onClick={handleSave}
                disabled={saving}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 ${
                  saved
                    ? "bg-green-500 text-white"
                    : "bg-[hsl(25,95%,53%)] hover:bg-[hsl(25,95%,45%)] text-white"
                }`}
                data-testid="button-save-settings"
              >
                {saved ? <><CheckCircle size={15} /> Saved!</> : <><Save size={15} /> {saving ? "Saving…" : "Save Settings"}</>}
              </button>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
