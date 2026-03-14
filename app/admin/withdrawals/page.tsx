"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { clearSessionCookie } from "@/app/lib/auth";
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  ShieldCheck,
  Banknote,
  Wallet,
  Settings,
  Bell,
  LogOut,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Loader2,
  AlertCircle,
  FileCheck,
  Copy,
  CheckCheck,
} from "lucide-react";
import Link from "next/link";

interface PendingWithdrawal {
  withdrawal_id: string;
  employee_id: string;
  employee_name: string;
  token: string;
  wallet_address: string;
  amount: number;
  status: string;
  created_at: string;
}

export default function AdminWithdrawalsPage() {
  const router = useRouter();
  const [pendingWithdrawals, setPendingWithdrawals] = useState<PendingWithdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const navItems = [
    { name: "Dashboard",       icon: LayoutDashboard, href: "/admin/dashboard" },
    { name: "Employees",       icon: Users,           href: "/admin/employees" },
    { name: "Assign Task",     icon: ClipboardList,   href: "/admin/assign-task" },
    { name: "Proof Approvals", icon: ShieldCheck,     href: "/admin/proof-approvals" },
    { name: "Funding Logs",    icon: Banknote,        href: "/admin/funding-authorizations" },
    { name: "Withdrawals",     icon: Wallet,          href: "/admin/withdrawals" },
    { name: "Settings",        icon: Settings,        href: "#" },
  ];

  const fetchPendingWithdrawals = async () => {
    try {
      const res = await fetch("/api/admin/withdrawals/pending");
      if (res.ok) {
        const data = await res.json();
        setPendingWithdrawals(data);
      }
    } catch (err) {
      console.error("Failed to fetch pending withdrawals", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingWithdrawals();
    const interval = setInterval(fetchPendingWithdrawals, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    clearSessionCookie();
    router.push("/admin/login");
  };

  const handleAction = async (id: string, action: "approve" | "reject") => {
    setProcessingId(id);
    try {
      const endpoint = action === "approve" ? "approve" : "reject";
      const res = await fetch(`/api/admin/withdrawals/${id}/${endpoint}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ admin_email: "admin@system.local" }),
      });

      if (res.ok) {
        setPendingWithdrawals((prev) => prev.filter((w) => w.withdrawal_id !== id));
      } else {
        alert(`Failed to ${action} withdrawal. Please try again.`);
      }
    } catch (err) {
      console.error(`Error during withdrawal ${action}:`, err);
      alert("A network error occurred.");
    } finally {
      setProcessingId(null);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="flex h-screen bg-slate-50 font-sans overflow-hidden">
      {/* ── SIDEBAR ── */}
      <aside className="w-[240px] bg-white border-r border-slate-100 hidden md:flex flex-col shrink-0">
        <div className="px-6 py-5 border-b border-slate-100">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Wallet className="w-4 h-4 text-white" />
            </div>
            <div>
              <span className="text-sm font-bold text-slate-800 tracking-tight block">EmployeeCore</span>
              <span className="text-[10px] font-semibold text-blue-500 uppercase tracking-widest">Admin Panel</span>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {navItems.map((item) => {
            const isActive = item.name === "Withdrawals";
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`w-full flex items-center px-3 py-2.5 rounded-lg transition-all duration-150 text-sm ${
                  isActive
                    ? "bg-blue-50 text-blue-600 font-semibold"
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-800 font-medium"
                }`}
              >
                <item.icon className={`w-4 h-4 mr-3 ${isActive ? "text-blue-600" : "text-slate-400"}`} />
                {item.name}
                {isActive && <div className="ml-auto w-1.5 h-1.5 bg-blue-600 rounded-full" />}
              </Link>
            );
          })}
        </nav>

        <div className="px-4 py-4 border-t border-slate-100">
          <div className="flex items-center space-x-3 px-2 py-2">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center shrink-0">
              <span className="text-white text-xs font-bold">AD</span>
            </div>
            <div className="overflow-hidden flex-1">
              <p className="text-xs font-semibold text-slate-800 truncate">Admin User</p>
              <p className="text-xs text-slate-400 truncate font-mono">admin@system.local</p>
            </div>
            <button onClick={handleLogout} title="Logout" className="text-slate-300 hover:text-red-500 transition-colors p-1 shrink-0">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* ── MAIN CONTENT ── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* TOP HEADER */}
        <header className="bg-white border-b border-slate-100 h-16 flex items-center justify-between px-8 shrink-0">
          <div className="flex items-center space-x-3">
            <h1 className="text-base font-semibold text-slate-800">Withdrawals Queue</h1>
            <div className="flex items-center text-xs text-slate-400 space-x-1 ml-2">
              <span>Admin</span>
              <ChevronRight className="w-3 h-3" />
              <span className="text-blue-600 font-medium">Withdrawals</span>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <button className="relative p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
              <Bell className="w-5 h-5" />
            </button>
            <div className="flex items-center space-x-2 border-l border-slate-100 pl-4">
              <div className="w-8 h-8 bg-slate-900 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">AD</span>
              </div>
              <span className="text-sm font-semibold text-slate-700 hidden sm:block">Administrator</span>
            </div>
          </div>
        </header>

        {/* PAGE CONTENT */}
        <main className="flex-1 overflow-y-auto p-8 bg-slate-50">
          <div className="max-w-6xl mx-auto space-y-6">

            <div className="flex items-center justify-between mb-2">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Withdrawals Queue</h2>
                <p className="text-sm text-slate-500 mt-1">
                  Review employee withdrawal requests before payout.
                </p>
              </div>
              <span className="px-3 py-1 bg-amber-100 text-amber-700 text-xs font-bold rounded-full uppercase tracking-wider">
                {pendingWithdrawals.length} Pending
              </span>
            </div>

            <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="w-full overflow-x-auto">
                <table className="w-full text-left border-collapse cursor-default">
                  <thead>
                    <tr className="bg-slate-50/50">
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">Employee Name</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">Token</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">Amount</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">Wallet Address</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">Date</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {loading ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                          <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-500 mb-3" />
                          <p className="text-sm font-medium">Loading withdrawals...</p>
                        </td>
                      </tr>
                    ) : pendingWithdrawals.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-16 text-center text-slate-400">
                          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <FileCheck className="w-8 h-8 text-slate-200" />
                          </div>
                          <p className="text-base font-bold text-slate-800 mb-1">No pending withdrawals.</p>
                          <p className="text-sm">All requests have been handled.</p>
                        </td>
                      </tr>
                    ) : (
                      pendingWithdrawals.map((w) => (
                        <tr key={w.withdrawal_id} className="hover:bg-slate-50/70 transition-colors">
                          {/* Employee */}
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-xs font-bold shrink-0">
                                {w.employee_name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-slate-800">{w.employee_name}</p>
                                <p className="text-[10px] text-slate-400 font-mono uppercase">{w.employee_id}</p>
                              </div>
                            </div>
                          </td>
                          {/* Token */}
                          <td className="px-6 py-4 whitespace-nowrap">
                            <p className="text-sm font-semibold text-slate-700">{w.token}</p>
                          </td>
                          {/* Amount */}
                          <td className="px-6 py-4 whitespace-nowrap">
                            <p className="text-sm font-bold text-slate-900">${Number(w.amount).toFixed(2)}</p>
                          </td>
                          <td className="px-6 py-4 max-w-[220px]">
                            <div className="flex items-center space-x-2">
                              <span className="text-xs font-mono text-slate-600 bg-slate-50 px-2 py-1 rounded border border-slate-100 block truncate" title={w.wallet_address}>
                                {w.wallet_address.length > 20 ? w.wallet_address.substring(0, 16) + "…" + w.wallet_address.slice(-4) : w.wallet_address}
                              </span>
                              <button
                                onClick={() => copyToClipboard(w.wallet_address, w.withdrawal_id)}
                                className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors shrink-0"
                                title="Copy Address"
                              >
                                {copiedId === w.withdrawal_id ? (
                                  <CheckCheck className="w-3.5 h-3.5 text-emerald-500" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </div>
                          </td>
                          {/* Date */}
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-xs font-medium text-slate-500 uppercase tracking-widest">{new Date(w.created_at).toLocaleDateString()}</span>
                          </td>
                          {/* Actions */}
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <div className="flex items-center justify-end space-x-2">
                              <button
                                onClick={() => handleAction(w.withdrawal_id, "reject")}
                                disabled={processingId === w.withdrawal_id}
                                className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100 disabled:opacity-50"
                                title="Reject"
                              >
                                {processingId === w.withdrawal_id
                                  ? <Loader2 className="w-4 h-4 animate-spin" />
                                  : <XCircle className="w-5 h-5" />
                                }
                              </button>
                              <button
                                onClick={() => handleAction(w.withdrawal_id, "approve")}
                                disabled={processingId === w.withdrawal_id}
                                className="flex items-center px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-colors shadow-sm shadow-emerald-200/50 disabled:opacity-50"
                              >
                                {processingId === w.withdrawal_id
                                  ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                                  : <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                                }
                                Approve
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        </main>
      </div>
    </div>
  );
}
