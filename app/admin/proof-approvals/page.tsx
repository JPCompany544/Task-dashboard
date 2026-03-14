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
  Settings,
  Bell,
  LogOut,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Eye,
  Loader2,
  FileCheck,
  AlertCircle,
  Wallet,
  Menu,
  X,
} from "lucide-react";
import Link from "next/link";

interface PendingProof {
  task_id: string;
  employee_id: string;
  employee_name: string;
  token: string;
  purchase_amount: number;
  exchange: string;
  completion_proof_url?: string;
  completion_tx_hash?: string;
  completion_wallet?: string;
  proof_status: string;
  status: string;
  updated_at: string;
}

export default function ProofApprovalsPage() {
  const router = useRouter();
  const [pendingProofs, setPendingProofs] = useState<PendingProof[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const getFileType = (url: string) => {
    if (!url) return "unknown";
    const lowerUrl = url.toLowerCase();
    if (lowerUrl.match(/\.(jpg|jpeg|png|gif|webp|bmp|svg)/) || lowerUrl.includes("image/upload")) return "image";
    if (lowerUrl.endsWith(".pdf") || lowerUrl.includes("/raw/upload") || lowerUrl.includes(".pdf")) return "pdf";
    if (lowerUrl.match(/\.(mp4|webm|ogg|mov|mkv|3gp|wmv)/) || lowerUrl.includes("video/upload")) return "video";
    return "unknown";
  };

  const navItems = [
    { name: "Dashboard",       icon: LayoutDashboard, href: "/admin/dashboard" },
    { name: "Employees",       icon: Users,           href: "/admin/employees" },
    { name: "Assign Task",     icon: ClipboardList,   href: "/admin/assign-task" },
    { name: "Proof Approvals", icon: ShieldCheck,     href: "/admin/proof-approvals" },
    { name: "Funding Logs",    icon: Banknote,        href: "/admin/funding-authorizations" },
    { name: "Withdrawals",     icon: Wallet,          href: "/admin/withdrawals" },
    { name: "Settings",        icon: Settings,        href: "#" },
  ];

  const fetchPendingProofs = async () => {
    try {
      const res = await fetch("/api/admin/proof-pending");
      if (res.ok) {
        const data = await res.json();
        setPendingProofs(data);
      }
    } catch (err) {
      console.error("Failed to fetch pending proofs", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingProofs();
    const interval = setInterval(fetchPendingProofs, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    clearSessionCookie();
    router.push("/admin/login");
  };

  const handleAction = async (taskId: string, action: "approve" | "reject") => {
    setProcessingId(taskId);
    try {
      const endpoint = action === "approve" ? "approve-proof" : "reject-proof";
      const res = await fetch(`/api/admin/tasks/${taskId}/${endpoint}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ admin_email: "admin@system.local" }),
      });

      if (res.ok) {
        // Remove from local list immediately
        setPendingProofs((prev) => prev.filter((t) => t.task_id !== taskId));
      } else {
        alert(`Failed to ${action} proof. Please try again.`);
      }
    } catch (err) {
      console.error(`Error during proof ${action}:`, err);
      alert("A network error occurred.");
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 font-sans overflow-hidden">
      {/* ── MOBILE SIDEBAR ── */}
      {isSidebarOpen && (
        <div className="fixed inset-0 z-[100] flex md:hidden">
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsSidebarOpen(false)} />
          <aside className="relative w-[280px] bg-white h-full flex flex-col shadow-2xl animate-in slide-in-from-left duration-300">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4 text-white" />
                </div>
                <div>
                  <span className="text-sm font-bold text-slate-800 tracking-tight block">EmployeeCore</span>
                  <span className="text-[10px] font-semibold text-blue-500 uppercase tracking-widest">Admin Panel</span>
                </div>
              </div>
              <button onClick={() => setIsSidebarOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
              {navItems.map((item) => {
                const isActive = item.name === "Proof Approvals";
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setIsSidebarOpen(false)}
                    className={`w-full flex items-center px-4 py-3 rounded-xl transition-all duration-150 text-sm ${isActive ? "bg-blue-50 text-blue-600 font-bold" : "text-slate-500 hover:bg-slate-50 hover:text-slate-800 font-medium"}`}
                  >
                    <item.icon className={`w-5 h-5 mr-3 ${isActive ? "text-blue-600" : "text-slate-400"}`} />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
            <div className="px-4 py-4 border-t border-slate-100 bg-slate-50/50">
              <div className="flex items-center justify-between px-2 py-2">
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 bg-blue-600 rounded-full flex items-center justify-center shrink-0">
                    <span className="text-white text-xs font-bold">AD</span>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800 truncate">Admin User</p>
                    <p className="text-[10px] text-slate-400 truncate font-mono">admin@system.local</p>
                  </div>
                </div>
                <button onClick={handleLogout} className="text-slate-300 hover:text-red-500 p-2">
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            </div>
          </aside>
        </div>
      )}

      {/* ── DESKTOP SIDEBAR ── */}
      <aside className="w-[240px] bg-white border-r border-slate-100 hidden md:flex flex-col shrink-0">
        <div className="px-6 py-5 border-b border-slate-100">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <ShieldCheck className="w-4 h-4 text-white" />
            </div>
            <div>
              <span className="text-sm font-bold text-slate-800 tracking-tight block">EmployeeCore</span>
              <span className="text-[10px] font-semibold text-blue-500 uppercase tracking-widest">Admin Panel</span>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {navItems.map((item) => {
            const isActive = item.name === "Proof Approvals";
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`w-full flex items-center px-3 py-2.5 rounded-lg transition-all duration-150 text-sm ${isActive ? "bg-blue-50 text-blue-600 font-semibold" : "text-slate-500 hover:bg-slate-50 hover:text-slate-800 font-medium"
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
        <header className="bg-white border-b border-slate-100 h-16 flex items-center justify-between px-4 md:px-8 shrink-0">
          <div className="flex items-center">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 mr-3 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg md:hidden"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex flex-col md:flex-row md:items-center md:space-x-3">
              <h1 className="text-sm md:text-base font-semibold text-slate-800 truncate">Proof Approvals</h1>
              <div className="hidden sm:flex items-center text-[10px] md:text-xs text-slate-400 space-x-1 sm:ml-2">
                <span>Admin</span>
                <ChevronRight className="w-3 h-3" />
                <span className="text-blue-600 font-medium">Proof Approvals</span>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2 md:space-x-4">
            <button className="relative p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
              <Bell className="w-4 h-4 md:w-5 h-5" />
            </button>
            <div className="flex items-center space-x-2 border-l border-slate-100 pl-2 md:pl-4">
              <div className="w-7 h-7 md:w-8 md:h-8 bg-slate-900 rounded-full flex items-center justify-center shrink-0">
                <span className="text-white text-[10px] md:text-xs font-bold">AD</span>
              </div>
              <span className="text-[10px] md:text-sm font-semibold text-slate-700 hidden lg:block">Administrator</span>
            </div>
          </div>
        </header>

        {/* PAGE CONTENT */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-slate-50">
          <div className="max-w-6xl mx-auto space-y-6">

            <div className="flex items-center justify-between mb-2">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Proof Review Queue</h2>
                <p className="text-sm text-slate-500 mt-1">
                  Review and approve or reject task proof submissions from employees.
                </p>
              </div>
              <span className="px-3 py-1 bg-amber-100 text-amber-700 text-xs font-bold rounded-full uppercase tracking-wider">
                {pendingProofs.length} Pending
              </span>
            </div>

            <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="w-full overflow-x-auto">
                <table className="w-full text-left border-collapse cursor-default">
                  <thead>
                    <tr className="bg-slate-50/50">
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">Employee</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">Token</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">Amount</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">Tx Hash</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">Wallet</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100 text-center">Screenshot</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {loading ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                          <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-500 mb-3" />
                          <p className="text-sm font-medium">Loading proof queue...</p>
                        </td>
                      </tr>
                    ) : pendingProofs.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-16 text-center text-slate-400">
                          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <FileCheck className="w-8 h-8 text-slate-200" />
                          </div>
                          <p className="text-base font-bold text-slate-800 mb-1">No proofs awaiting approval.</p>
                          <p className="text-sm">All submitted proofs have been reviewed.</p>
                        </td>
                      </tr>
                    ) : (
                      pendingProofs.map((task) => (
                        <tr key={task.task_id} className="hover:bg-slate-50/70 transition-colors">
                          {/* Employee */}
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-xs font-bold shrink-0">
                                {task.employee_name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-slate-800">{task.employee_name}</p>
                                <p className="text-[10px] text-slate-400 font-mono uppercase">{task.employee_id}</p>
                              </div>
                            </div>
                          </td>
                          {/* Token */}
                          <td className="px-6 py-4 whitespace-nowrap">
                            <p className="text-sm font-semibold text-slate-700">{task.token}</p>
                          </td>
                          {/* Amount */}
                          <td className="px-6 py-4 whitespace-nowrap">
                            <p className="text-sm font-bold text-slate-900">${Number(task.purchase_amount).toFixed(2)}</p>
                          </td>
                          {/* Tx Hash */}
                          <td className="px-6 py-4 max-w-[160px]">
                            {task.completion_tx_hash ? (
                              <span className="text-xs font-mono text-slate-600 bg-slate-50 px-2 py-1 rounded border border-slate-100 block truncate" title={task.completion_tx_hash}>
                                {task.completion_tx_hash.length > 18 ? task.completion_tx_hash.slice(0, 18) + "…" : task.completion_tx_hash}
                              </span>
                            ) : (
                              <span className="text-xs text-slate-400 italic">—</span>
                            )}
                          </td>
                          {/* Wallet */}
                          <td className="px-6 py-4 max-w-[140px]">
                            {task.completion_wallet ? (
                              <span className="text-xs font-mono text-slate-600 bg-slate-50 px-2 py-1 rounded border border-slate-100 block truncate" title={task.completion_wallet}>
                                {task.completion_wallet.length > 16 ? task.completion_wallet.slice(0, 16) + "…" : task.completion_wallet}
                              </span>
                            ) : (
                              <span className="text-xs text-slate-400 italic">—</span>
                            )}
                          </td>
                          {/* Screenshot */}
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            {task.completion_proof_url ? (
                              <button
                                onClick={() => setPreviewId(task.task_id)}
                                className="inline-flex items-center px-3 py-1.5 bg-slate-100 hover:bg-blue-100 text-slate-600 hover:text-blue-700 text-xs font-semibold rounded-lg transition-colors border border-slate-200 hover:border-blue-200"
                              >
                                <Eye className="w-3.5 h-3.5 mr-1.5" />
                                View
                              </button>
                            ) : (
                              <span className="text-xs text-slate-400 italic">No file</span>
                            )}
                          </td>
                          {/* Actions */}
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <div className="flex items-center justify-end space-x-2">
                              <button
                                onClick={() => handleAction(task.task_id, "reject")}
                                disabled={processingId === task.task_id}
                                className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100 disabled:opacity-50"
                                title="Reject Proof"
                              >
                                {processingId === task.task_id
                                  ? <Loader2 className="w-4 h-4 animate-spin" />
                                  : <XCircle className="w-5 h-5" />
                                }
                              </button>
                              <button
                                onClick={() => handleAction(task.task_id, "approve")}
                                disabled={processingId === task.task_id}
                                className="flex items-center px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-colors shadow-sm shadow-emerald-200/50 disabled:opacity-50"
                              >
                                {processingId === task.task_id
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

            <div className="bg-blue-50 border border-blue-100 rounded-xl p-5 flex items-start space-x-4">
              <div className="p-2 bg-blue-100 rounded-lg shrink-0">
                <AlertCircle className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-blue-800">Review Protocol</h4>
                <p className="text-xs text-blue-600 mt-1 leading-relaxed">
                  Verify the transaction hash and wallet address match the task requirements before approving.
                  Approved tasks will be marked complete and the employee commission will be unlocked.
                  Rejected tasks allow the employee to resubmit valid proof.
                </p>
              </div>
            </div>

          </div>
        </main>
      </div>

      {/* ── PREVIEW MODAL ── */}
      {previewId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setPreviewId(null)} />
          <div className="relative bg-white w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Proof Preview</h3>
                <p className="text-[10px] text-slate-400 font-mono uppercase mt-0.5">{previewId}</p>
              </div>
              <button onClick={() => setPreviewId(null)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-colors">
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-auto p-6 bg-slate-50 flex items-center justify-center min-h-[300px]">
              {(() => {
                const task = pendingProofs.find(t => t.task_id === previewId);
                if (!task || !task.completion_proof_url) return null;
                const fileType = getFileType(task.completion_proof_url);
                
                if (fileType === "image") {
                  return (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={task.completion_proof_url} alt="Proof" className="max-w-full max-h-full object-contain rounded-lg shadow-sm border border-slate-200" />
                  );
                } else if (fileType === "video") {
                  return (
                    <video controls src={task.completion_proof_url} className="max-w-full max-h-full rounded-lg shadow-sm" />
                  );
                } else if (fileType === "pdf") {
                  return (
                    <div className="text-center p-12 bg-white rounded-2xl border border-slate-200 shadow-sm">
                      <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
                        <FileCheck className="w-10 h-10" />
                      </div>
                      <h4 className="text-lg font-bold text-slate-900 mb-2">PDF Document</h4>
                      <p className="text-sm text-slate-500 mb-8 max-w-xs mx-auto">This proof is a PDF document. Please open it in a new window to review.</p>
                      <a 
                        href={task.completion_proof_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all shadow-md shadow-blue-100"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Open PDF in New Tab
                      </a>
                    </div>
                  );
                } else {
                  return (
                    <div className="text-center p-12">
                      <p className="text-sm text-slate-500">Unable to preview this file type directly.</p>
                      <a href={task.completion_proof_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 font-bold hover:underline mt-4 block">
                        Open File Link
                      </a>
                    </div>
                  );
                }
              })()}
            </div>
            
            <div className="px-6 py-4 border-t border-slate-100 bg-white flex items-center justify-end space-x-3 shrink-0">
              <button
                onClick={() => { handleAction(previewId, "reject"); setPreviewId(null); }}
                className="px-5 py-2.5 text-red-600 hover:bg-red-50 font-bold text-xs rounded-xl transition-colors"
                disabled={processingId === previewId}
              >
                Reject Proof
              </button>
              <button
                onClick={() => { handleAction(previewId, "approve"); setPreviewId(null); }}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-all shadow-md shadow-emerald-100"
                disabled={processingId === previewId}
              >
                Approve Proof
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
