import { useState, useEffect } from "react";
import AdminLayout from "./AdminLayout";
import { Bot, Save, RotateCcw, CheckCircle } from "lucide-react";

const DEFAULT_PROMPT_HINT = "Describe your business, services, areas, pricing policy, tone, and anything the AI should know or say when talking to your customers.";

export default function AiSettings() {
  const [prompt, setPrompt] = useState("");
  const [original, setOriginal] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("admin_token");
    fetch("/api/admin/ai-settings", {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((r) => r.json())
      .then((data: { systemPrompt: string }) => {
        setPrompt(data.systemPrompt);
        setOriginal(data.systemPrompt);
      })
      .catch(() => setError("Failed to load AI settings."))
      .finally(() => setLoading(false));
  }, []);

  async function handleSave() {
    setSaving(true);
    setError(null);
    const token = localStorage.getItem("admin_token");
    try {
      const res = await fetch("/api/admin/ai-settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ systemPrompt: prompt }),
      });
      if (!res.ok) throw new Error("Save failed");
      const data: { systemPrompt: string } = await res.json();
      setPrompt(data.systemPrompt);
      setOriginal(data.systemPrompt);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      setError("Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  function handleReset() {
    setPrompt(original);
    setError(null);
  }

  const isDirty = prompt !== original;

  return (
    <AdminLayout>
      <div className="max-w-3xl">
        <div className="flex items-center gap-3 mb-2">
          <div className="bg-[hsl(25,95%,53%)] text-white rounded-lg p-2">
            <Bot size={20} />
          </div>
          <h1 className="text-2xl font-bold text-[hsl(214,60%,14%)]">AI Chat Settings</h1>
        </div>
        <p className="text-gray-500 text-sm mb-6">
          Edit what the chatbot knows about your business and how it responds to customers. Changes take effect immediately — no restart needed.
        </p>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <label className="block text-sm font-semibold text-[hsl(214,60%,14%)] mb-2">
            AI Instructions
          </label>
          <p className="text-xs text-gray-400 mb-3">
            {DEFAULT_PROMPT_HINT}
          </p>

          {loading ? (
            <div className="h-80 bg-gray-50 rounded-lg animate-pulse" />
          ) : (
            <textarea
              value={prompt}
              onChange={(e) => { setPrompt(e.target.value); setSaved(false); }}
              rows={24}
              className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm font-mono leading-relaxed text-gray-800 focus:outline-none focus:ring-2 focus:ring-[hsl(25,95%,53%)] resize-y"
              placeholder="Enter AI instructions…"
              data-testid="ai-settings-textarea"
            />
          )}

          {error && (
            <p className="mt-2 text-sm text-red-600">{error}</p>
          )}

          <div className="flex items-center justify-between mt-4 gap-3">
            <button
              onClick={handleReset}
              disabled={!isDirty || loading}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <RotateCcw size={15} />
              Discard changes
            </button>

            <div className="flex items-center gap-3">
              {saved && (
                <span className="flex items-center gap-1.5 text-sm text-green-600 font-medium">
                  <CheckCircle size={15} />
                  Saved!
                </span>
              )}
              <button
                onClick={handleSave}
                disabled={!isDirty || saving || loading}
                className="flex items-center gap-2 bg-[hsl(25,95%,53%)] text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-[hsl(25,95%,45%)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                data-testid="ai-settings-save"
              >
                <Save size={15} />
                {saving ? "Saving…" : "Save Changes"}
              </button>
            </div>
          </div>
        </div>

        <div className="mt-6 bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-blue-800">
          <p className="font-semibold mb-1">Tips for a better chatbot:</p>
          <ul className="list-disc list-inside space-y-1 text-blue-700">
            <li>Include specific services you offer and don't offer</li>
            <li>Mention your service areas (suburbs/regions)</li>
            <li>Set the tone — friendly, professional, brief</li>
            <li>Tell it what to say for pricing ("always suggest a site visit for exact quotes")</li>
            <li>Add any FAQs you get often ("how long does underground power take?")</li>
            <li>Tell it to always share your phone number for urgent enquiries</li>
          </ul>
        </div>
      </div>
    </AdminLayout>
  );
}
