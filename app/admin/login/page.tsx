"use client";

import React, { useState } from "react";
import { ShieldCheck, Eye, EyeOff, LogIn, AlertCircle } from "lucide-react";
import { ADMIN_EMAIL, ADMIN_PASSWORD, setSessionCookie } from "@/app/lib/auth";
import { useRouter } from "next/navigation";

export default function AdminLogin() {
  const router = useRouter();
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw]     = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    setTimeout(() => {
      if (
        email.trim().toLowerCase() === ADMIN_EMAIL.toLowerCase() &&
        password === ADMIN_PASSWORD
      ) {
        setSessionCookie("admin");
        router.push("/admin/dashboard");
      } else {
        setError("Invalid admin credentials.");
        setLoading(false);
      }
    }, 600);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 font-sans">
      {/* Brand header */}
      <div className="flex items-center space-x-3 mb-8">
        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-md shadow-blue-200">
          <ShieldCheck className="w-5 h-5 text-white" />
        </div>
        <div>
          <span className="text-lg font-bold text-slate-800 block leading-none">EmployeeCore</span>
          <span className="text-[10px] font-semibold text-blue-500 uppercase tracking-widest">Admin Portal</span>
        </div>
      </div>

      {/* Login card */}
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="h-1 w-full bg-blue-600" />
        <div className="px-8 py-8">
          <h1 className="text-xl font-bold text-slate-900 mb-1">Admin Login</h1>
          <p className="text-xs text-slate-400 mb-7">Restricted to authorized administrators only.</p>

          <form onSubmit={handleLogin} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Admin Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@gmail.com"
                required
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm placeholder:text-slate-400"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••"
                  required
                  className="w-full px-4 py-3 pr-12 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm placeholder:text-slate-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600 transition-colors p-1"
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-start space-x-2 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <p className="text-xs text-red-600 font-medium">{error}</p>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center py-3.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold text-sm rounded-xl transition-colors shadow-md shadow-blue-200/60"
            >
              {loading ? (
                <svg className="animate-spin w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
              ) : (
                <LogIn className="w-4 h-4 mr-2" />
              )}
              {loading ? "Authenticating..." : "Admin Login"}
            </button>
          </form>
        </div>
      </div>

      {/* Employee link */}
      <p className="mt-6 text-xs text-slate-400">
        Looking for employee login?{" "}
        <a href="/login" className="text-blue-600 font-semibold hover:underline">
          Employee Login →
        </a>
      </p>
    </div>
  );
}
