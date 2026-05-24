import { useState } from "react";
import { useLocation } from "wouter";
import { Zap, Lock } from "lucide-react";

export default function AdminLogin() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [, setLocation] = useLocation();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        setError("Incorrect password. Please try again.");
        return;
      }
      setLocation("/admin/dashboard");
    } catch {
      setError("Unable to connect to server. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[hsl(214,60%,14%)] flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="bg-[hsl(25,95%,53%)] rounded-xl p-3 mb-4">
            <Zap size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-[hsl(214,60%,14%)]">Admin Access</h1>
          <p className="text-gray-500 text-sm mt-1">Electrical Installers Management</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="text" name="username" value="admin" readOnly className="hidden" autoComplete="username" />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Lock size={14} className="inline mr-1" />
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(25,95%,53%)]"
              placeholder="Enter admin password"
              autoComplete="current-password"
              data-testid="input-admin-password"
            />
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[hsl(214,60%,20%)] text-white font-semibold py-2.5 rounded-lg hover:bg-[hsl(214,60%,14%)] transition-colors disabled:opacity-60"
            data-testid="button-admin-login"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}
