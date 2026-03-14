"use client";

import React, { useState } from "react";
import { ShieldCheck, Eye, EyeOff, LogIn, AlertCircle } from "lucide-react";
import { getAllEmployees, setSessionCookie } from "@/app/lib/auth";
import { useRouter } from "next/navigation";

export default function EmployeeLogin() {
  const router = useRouter();
  const [email, setEmail]       = useState("");
  const [empId, setEmpId]       = useState("");
  const [showId, setShowId]     = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/login/employee", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), employee_id: empId.trim() })
      });
      
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Login failed, try again later");
        setLoading(false);
        return;
      }

      // Success flow
      localStorage.setItem("ec_session", JSON.stringify(data));
      setSessionCookie("employee");
      router.push("/dashboard");

    } catch (err) {
      setError("Login failed, try again later");
      setLoading(false);
    }
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
          <span className="text-[10px] font-semibold text-blue-500 uppercase tracking-widest">Staff Portal</span>
        </div>
      </div>

      {/* Login card */}
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="h-1 w-full bg-blue-600" />
        <div className="px-8 py-8">
          <h1 className="text-xl font-bold text-slate-900 mb-1">Employee Login</h1>
          <p className="text-xs text-slate-400 mb-7">Sign in with your email and Employee ID.</p>

          <form onSubmit={handleLogin} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@company.io"
                required
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm placeholder:text-slate-400"
              />
            </div>

            {/* Employee ID */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Employee ID
              </label>
              <div className="relative">
                <input
                  type={showId ? "text" : "password"}
                  value={empId}
                  onChange={(e) => setEmpId(e.target.value)}
                  placeholder="EMP-XXXXX"
                  required
                  className="w-full px-4 py-3 pr-12 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm placeholder:text-slate-400 font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowId(!showId)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600 transition-colors p-1"
                >
                  {showId ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
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
              {loading ? "Authenticating..." : "Login"}
            </button>
          </form>
        </div>
      </div>

      {/* Admin link */}
      <p className="mt-6 text-xs text-slate-400">
        Are you an admin?{" "}
        <a href="/admin/login" className="text-blue-600 font-semibold hover:underline">
          Admin Login →
        </a>
      </p>
    </div>
  );
}
