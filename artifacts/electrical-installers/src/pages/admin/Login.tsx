import { useState } from "react";
import { useLocation } from "wouter";
import { Zap, Lock } from "lucide-react";

const ADMIN_PASSWORD = "admin123";

export default function AdminLogin() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [, setLocation] = useLocation();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      localStorage.setItem("admin_auth", "true");
      setLocation("/admin/dashboard");
    } else {
      setError("Incorrect password. Please try again.");
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
              data-testid="input-admin-password"
            />
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button
            type="submit"
            className="w-full bg-[hsl(214,60%,20%)] text-white font-semibold py-2.5 rounded-lg hover:bg-[hsl(214,60%,14%)] transition-colors"
            data-testid="button-admin-login"
          >
            Sign In
          </button>
        </form>
      </div>
    </div>
  );
}
