"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { clearSessionCookie } from "@/app/lib/auth";
import {
  LayoutDashboard,
  ClipboardList,
  DollarSign,
  Wallet,
  HeadphonesIcon,
  Settings,
  Bell,
  User,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  ChevronRight,
  Upload,
  Activity,
  TrendingUp,
  AlertCircle,
  ArrowLeft,
  ShieldCheck,
  Banknote,
  Lock,
  Copy,
  CheckCheck,
  Eye,
  EyeOff,
  LogOut,
  Menu,
  X,
} from "lucide-react";

type Screen = "dashboard" | "task" | "proof" | "reward" | "withdraw" | "support";
type NavItem = "Dashboard" | "My Task" | "Withdraw" | "Support" | "Settings";

export default function Dashboard() {
  const router = useRouter();
  const [screen, setScreen] = useState<Screen>("dashboard");
  const [activeNav, setActiveNav] = useState<NavItem>("Dashboard");
  const [taskStatus, setTaskStatus] = useState<string>("Pending");
  const [proofStatus, setProofStatus] = useState<string>("none"); // none | pending | approved | rejected
  const [txHash, setTxHash] = useState("");
  const [walletAddr, setWalletAddr] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [fundingConfirmed, setFundingConfirmed] = useState(false);
  const [fundingStatus, setFundingStatus] = useState<string>("none");
  const [refNumber, setRefNumber] = useState("");
  const [receiptFileName, setReceiptFileName] = useState<string | null>(null);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [addressCopied, setAddressCopied] = useState(false);
  const [showBalance, setShowBalance] = useState(true);
  const [showEarnings, setShowEarnings] = useState(true);
  const [timeLeft, setTimeLeft] = useState<number | null>(null); // null = no active task yet
  const [session, setSession] = useState<{ name: string, employee_id: string, email: string } | null>(null);
  const [task, setTask] = useState<any>(null);
  const [loadingTask, setLoadingTask] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Live stats
  const [availableBalance, setAvailableBalance] = useState(0);
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [tasksCompleted, setTasksCompleted] = useState(0);

  // Withdraw state
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawToken, setWithdrawToken] = useState("USDT");
  const [withdrawWallet, setWithdrawWallet] = useState("");
  const [withdrawError, setWithdrawError] = useState("");
  const [withdrawSuccess, setWithdrawSuccess] = useState("");
  const [withdrawing, setWithdrawing] = useState(false);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);

  useEffect(() => {
    let currentSession: any = null;
    try {
      const stored = localStorage.getItem("ec_session");
      if (stored) {
        currentSession = JSON.parse(stored);
        setSession(currentSession);
      }
    } catch (e) { }

    // Fetch live stats & withdrawals
    const fetchStats = async () => {
      if (!currentSession?.employee_id) return;
      try {
        const res = await fetch(`/api/employee/stats?employee_id=${currentSession.employee_id}`);
        if (res.ok) {
          const data = await res.json();
          setAvailableBalance(data.available_balance ?? 0);
          setTotalEarnings(data.total_earnings ?? 0);
          setTasksCompleted(data.tasks_completed ?? 0);
        }
        const wRes = await fetch(`/api/withdrawals?employee_id=${currentSession.employee_id}`);
        if (wRes.ok) {
          setWithdrawals(await wRes.json());
        }
      } catch (e) {
        console.error("Unable to load stats or withdrawals", e);
      }
    };

    // Fetch live tasks
    const fetchTasks = async () => {
      if (!currentSession?.employee_id) return;
      try {
        const res = await fetch(`/api/tasks?employee_id=${currentSession.employee_id}`);
        if (res.ok) {
          const tasks = await res.json();
          if (tasks && tasks.length > 0) {
            const t = tasks[0];
            setTask(t);
            setFundingStatus(t.funding_status || "none");
            setFundingConfirmed(t.funding_status === "approved" || t.funding_confirmed);
            setTaskStatus(t.status);
            setProofStatus(t.proof_status || "none");

            // Countdown: only set if task is active (not completed/approved proof)
            const isCompleted = t.proof_status === "approved" || t.status === "completed";
            if (!isCompleted && t.deadline) {
              const diff = Math.floor((new Date(t.deadline).getTime() - Date.now()) / 1000);
              setTimeLeft(diff > 0 ? diff : 0);
            } else {
              setTimeLeft(null); // stop countdown
            }
          } else {
            setTimeLeft(null); // no task assigned
          }
        }
      } catch (e) {
        console.error("Unable to load tasks", e);
      } finally {
        setLoadingTask(false);
      }
    };

    fetchStats();
    fetchTasks();

    const statsInterval = setInterval(fetchStats, 5000);
    const taskInterval = setInterval(fetchTasks, 5000);

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev === null || prev <= 0) return prev; // no task or expired
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(statsInterval);
      clearInterval(taskInterval);
      clearInterval(timer);
    };
  }, []);

  const handleConfirmFunds = async () => {
    if (!task) return;
    setSubmitting(true);
    try {
      if (receiptFile) {
        // Upload proof image/pdf
        const formData = new FormData();
        formData.append("proof", receiptFile);

        const res = await fetch(`/api/tasks/${task.task_id}/funding-proof`, {
          method: "PATCH",
          body: formData
        });
        if (res.ok) {
          setFundingStatus("pending");
        } else {
          alert("Unable to submit proof, try again.");
        }
      } else {
        // Fallback for ref number (for now we still consider it pending)
        alert("Please upload a receipt file to proceed.");
      }
    } catch (e) {
      alert("Unable to confirm, try again later");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitProof = async () => {
    if (!task) return;
    if (!txHash.trim() || !walletAddr.trim()) {
      setSubmitError("Transaction hash and wallet address are required.");
      return;
    }

    setSubmitting(true);
    setSubmitError("");
    try {
      const formData = new FormData();
      formData.append("tx_hash", txHash.trim());
      formData.append("wallet", walletAddr.trim());
      if (screenshotFile) formData.append("screenshot", screenshotFile);

      const res = await fetch(`/api/tasks/${task.task_id}/submit-proof`, {
        method: "PATCH",
        body: formData,
      });

      if (res.ok) {
        setProofStatus("pending");
        setTaskStatus("proof_submitted");
        setScreen("reward");
      } else {
        const data = await res.json().catch(() => ({}));
        setSubmitError(data?.error || "Unable to submit proof, please try again.");
      }
    } catch (e) {
      setSubmitError("Network error. Unable to submit proof.");
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (seconds: number | null) => {
    if (seconds === null || seconds <= 0) return "—";
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}h : ${m.toString().padStart(2, '0')}m : ${s.toString().padStart(2, '0')}s`;
  };

  const COMPANY_WALLET = "0xDfB2F825E8E89378f04375c07BC8Cc522cb194cb";

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(COMPANY_WALLET).then(() => {
      setAddressCopied(true);
      setTimeout(() => setAddressCopied(false), 2500);
    });
  };

  const handleWithdrawSubmit = async () => {
    if (!withdrawWallet.trim()) {
      setWithdrawError("Wallet address is required.");
      return;
    }
    const num = Number(withdrawAmount);
    if (isNaN(num) || num <= 0) {
      setWithdrawError("Amount must be greater than 0.");
      return;
    }
    if (num > availableBalance) {
      setWithdrawError("Withdrawal amount exceeds available balance.");
      return;
    }

    setWithdrawing(true);
    setWithdrawError("");
    setWithdrawSuccess("");
    try {
      const res = await fetch("/api/withdrawals/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employee_id: session?.employee_id,
          token: withdrawToken,
          wallet_address: withdrawWallet,
          amount: num
        })
      });
      const data = await res.json();
      if (res.ok) {
        setWithdrawSuccess("Withdrawal request submitted successfully.");
        setWithdrawAmount("");
        setWithdrawWallet("");
      } else {
        setWithdrawError(data.error || "Failed to submit request.");
      }
    } catch (e) {
      setWithdrawError("Network error. Please try again.");
    } finally {
      setWithdrawing(false);
    }
  };

  const handleLogout = () => {
    clearSessionCookie();
    router.push("/login");
  };

  const renderProofForm = () => (
    <div className="space-y-5">
      <div className="flex items-center p-4 bg-blue-50 border border-blue-100 rounded-xl">
        <div className="w-2 h-2 bg-blue-500 rounded-full mr-3 animate-pulse" />
        <p className="text-sm font-medium text-blue-700">Task In Progress — Submit proof to complete</p>
      </div>

      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-2">
          Transaction Hash <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={txHash}
          onChange={(e) => setTxHash(e.target.value)}
          placeholder="e.g. 5xV7kP3qA1mN9rB2..."
          className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm placeholder:text-slate-400 font-mono"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-2">
          Wallet Address <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={walletAddr}
          onChange={(e) => setWalletAddr(e.target.value)}
          placeholder="Deposit wallet address used"
          className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm placeholder:text-slate-400 font-mono"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-2">
          Screenshot Proof <span className="text-slate-400 text-xs font-normal">(optional but recommended)</span>
        </label>
        <label className="border-2 border-dashed border-slate-200 hover:border-blue-400 rounded-xl p-10 text-center cursor-pointer flex flex-col items-center justify-center transition-colors group bg-slate-50 hover:bg-blue-50">
          <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-3 group-hover:bg-blue-200 transition-colors">
            <Upload className="w-6 h-6 text-blue-600" />
          </div>
          <p className="text-sm font-semibold text-slate-700 mb-1 group-hover:text-blue-700">
            {fileName ? fileName : "Click to upload screenshot"}
          </p>
          <p className="text-xs text-slate-400">PNG, JPG or PDF — max 5MB</p>
          <input
            type="file"
            className="hidden"
            accept="image/*,.pdf"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) {
                setFileName(f.name);
                setScreenshotFile(f);
              }
            }}
          />
        </label>
      </div>

      {submitError && (
        <div className="flex items-center space-x-2 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
          <p className="text-xs text-red-600 font-medium">{submitError}</p>
        </div>
      )}

      <button
        onClick={handleSubmitProof}
        disabled={submitting}
        className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold text-base rounded-xl transition-colors shadow-md shadow-blue-200/60 mt-2 flex items-center justify-center"
      >
        {submitting ? "Submitting..." : "Submit Proof"}
      </button>
    </div>
  );

  const navItems: { name: NavItem; icon: React.ElementType }[] = [
    { name: "Dashboard", icon: LayoutDashboard },
    { name: "My Task", icon: ClipboardList },
    { name: "Withdraw", icon: Wallet },
    { name: "Support", icon: HeadphonesIcon },
    { name: "Settings", icon: Settings },
  ];

  const handleNavClick = (name: NavItem) => {
    setActiveNav(name);
    if (name === "Dashboard") setScreen("dashboard");
    if (name === "My Task") setScreen("task");
    if (name === "Withdraw") {
      setScreen("withdraw");
      setWithdrawError("");
      setWithdrawSuccess("");
    }
    if (name === "Support") setScreen("support");
    setIsMobileMenuOpen(false); // Close mobile menu on click
  };

  const pageTitles: Record<Screen, string> = {
    dashboard: "Employee Dashboard",
    task: "My Task",
    proof: "Submit Proof",
    reward: "Task Reward",
    withdraw: "Request Withdrawal",
    support: "Live Support",
  };

  return (
    <div className="flex h-screen bg-slate-50 font-sans overflow-hidden">

      {/* ── SIDEBAR ── */}
      <aside className="w-[240px] bg-white border-r border-slate-100 hidden md:flex flex-col shrink-0">
        <div className="px-6 py-5 border-b border-slate-100">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white text-xs font-bold">EC</span>
            </div>
            <span className="text-sm font-bold text-slate-800 tracking-tight">EmployeeCore</span>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {navItems.map((item) => {
            const isActive = activeNav === item.name;
            return (
              <button
                key={item.name}
                onClick={() => handleNavClick(item.name)}
                className={`w-full flex items-center px-3 py-2.5 rounded-lg transition-all duration-150 text-sm ${isActive
                  ? "bg-blue-50 text-blue-600 font-semibold"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-800 font-medium"
                  }`}
              >
                <item.icon className={`w-4 h-4 mr-3 ${isActive ? "text-blue-600" : "text-slate-400"}`} />
                {item.name}
                {isActive && <div className="ml-auto w-1.5 h-1.5 bg-blue-600 rounded-full" />}
              </button>
            );
          })}
        </nav>

        <div className="px-4 py-4 border-t border-slate-100">
          <div className="flex items-center space-x-3 px-2 py-2">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
              <User className="w-4 h-4 text-blue-600" />
            </div>
            <div className="overflow-hidden flex-1">
              <p className="text-xs font-semibold text-slate-800 truncate">{session?.name || "Employee"}</p>
              <p className="text-xs text-slate-400 truncate font-mono">{session?.employee_id || "EMP-XXXXX"}</p>
            </div>
            <button onClick={handleLogout} title="Logout" className="text-slate-300 hover:text-red-500 transition-colors p-1 shrink-0">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* ── MOBILE SIDEBAR ── */}
      <div className={`fixed inset-0 z-50 md:hidden transition-opacity duration-300 ${isMobileMenuOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`}>
        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)} />
        <aside className={`absolute top-0 left-0 h-full w-[280px] bg-white shadow-2xl transition-transform duration-300 flex flex-col ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"}`}>
          <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white text-xs font-bold">EC</span>
              </div>
              <span className="text-sm font-bold text-slate-800 tracking-tight">EmployeeCore</span>
            </div>
            <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-lg transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
          <nav className="flex-1 px-4 py-6 space-y-1">
            {navItems.map((item) => {
              const isActive = activeNav === item.name;
              return (
                <button
                  key={item.name}
                  onClick={() => handleNavClick(item.name)}
                  className={`w-full flex items-center px-4 py-3 rounded-xl transition-all duration-200 text-sm ${isActive
                    ? "bg-blue-50 text-blue-600 font-bold"
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-800 font-medium"
                    }`}
                >
                  <item.icon className={`w-5 h-5 mr-3 ${isActive ? "text-blue-600" : "text-slate-400"}`} />
                  {item.name}
                  {isActive && <div className="ml-auto w-1.5 h-1.5 bg-blue-600 rounded-full" />}
                </button>
              );
            })}
          </nav>
          <div className="px-6 py-6 border-t border-slate-100">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
                <User className="w-5 h-5 text-blue-600" />
              </div>
              <div className="overflow-hidden flex-1">
                <p className="text-sm font-bold text-slate-800 truncate">{session?.name || "Employee"}</p>
                <p className="text-xs text-slate-400 truncate font-mono">{session?.employee_id || "EMP-XXXXX"}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center px-4 py-3 bg-red-50 text-red-600 font-bold rounded-xl hover:bg-red-100 transition-colors"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </button>
          </div>
        </aside>
      </div>

      {/* ── MAIN WRAPPER ── */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* ── TOP HEADER ── */}
        <header className="bg-white border-b border-slate-100 h-16 flex items-center justify-between px-4 md:px-8 shrink-0">
          <div className="flex items-center space-x-3">
            <button
              className="md:hidden p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors mr-1"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <Menu className="w-6 h-6" />
            </button>
            {screen !== "dashboard" && (
              <button
                onClick={() => {
                  if (screen === "task") setScreen("dashboard");
                  if (screen === "proof") setScreen("task");
                  if (screen === "reward") setScreen("proof");
                }}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors mr-1"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            <h1 className="text-base font-semibold text-slate-800">
              {screen === "dashboard" ? `Welcome, ${session?.name || "Employee"} (Employee)` : pageTitles[screen]}
            </h1>
            {screen !== "dashboard" && (
              <div className="flex items-center text-xs text-slate-400 space-x-1 ml-2">
                <span>Dashboard</span>
                <ChevronRight className="w-3 h-3" />
                <span className="text-blue-600 font-medium">{pageTitles[screen]}</span>
              </div>
            )}
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-bold">
                {session ? session.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() : "EM"}
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center px-3 py-1.5 text-xs font-semibold text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-slate-200 hover:border-red-200 hidden md:flex"
            >
              <LogOut className="w-3.5 h-3.5 mr-1.5" />
              Logout
            </button>
          </div>
        </header>

        {/* ── CONTENT AREA ── */}
        <main className="flex-1 overflow-y-auto p-8 bg-slate-50">
          <div className="max-w-5xl mx-auto">

            {/* ═══════════════════════════════════════ SCREEN 1 — DASHBOARD */}
            {screen === "dashboard" && (
              <div className="space-y-6">

                {/* 4 Stat Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    {
                      label: "Available Balance",
                      value: `$${availableBalance.toFixed(2)}`,
                      icon: Wallet,
                      color: "blue",
                      sub: totalEarnings > 0 ? `$${totalEarnings.toFixed(2)} total earned` : "No earnings yet",
                      canHide: true,
                      isVisible: showBalance,
                      toggle: () => setShowBalance(!showBalance),
                    },
                    {
                      label: "Total Earnings",
                      value: `$${totalEarnings.toFixed(2)}`,
                      icon: TrendingUp,
                      color: "emerald",
                      sub: "Approved tasks only",
                      canHide: true,
                      isVisible: showEarnings,
                      toggle: () => setShowEarnings(!showEarnings),
                    },
                    {
                      label: "Tasks Completed",
                      value: String(tasksCompleted),
                      icon: CheckCircle2,
                      color: "violet",
                      sub: `${tasksCompleted === 1 ? "task" : "tasks"} approved`,
                    },
                    {
                      label: "Active Task",
                      value: task ? taskStatus : "No Task",
                      icon: AlertCircle,
                      color: "amber",
                      sub: timeLeft !== null ? `${formatTime(timeLeft)} left` : task ? "Task completed" : "Awaiting assignment",
                    },
                  ].map((card) => {
                    const colors: Record<string, string> = {
                      blue: "bg-blue-50 text-blue-600",
                      emerald: "bg-emerald-50 text-emerald-600",
                      violet: "bg-violet-50 text-violet-600",
                      amber: "bg-amber-50 text-amber-600",
                    };
                    return (
                      <div key={card.label} className="bg-white rounded-xl p-5 border border-slate-100 shadow-sm">
                        <div className="flex items-start justify-between mb-3">
                          <p className="text-xs font-medium text-slate-500">{card.label}</p>
                          <div className="flex items-center space-x-2">
                            {card.canHide && (
                              <button onClick={card.toggle} className="text-slate-300 hover:text-blue-500 transition-colors">
                                {card.isVisible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                              </button>
                            )}
                            <div className={`p-2 rounded-lg ${colors[card.color]}`}>
                              <card.icon className="w-4 h-4" />
                            </div>
                          </div>
                        </div>
                        <p className={`text-2xl font-bold text-slate-900 mb-1 ${card.canHide && !card.isVisible ? "tracking-widest" : ""}`}>
                          {card.canHide && !card.isVisible ? "******" : card.value}
                        </p>
                        <p className="text-xs text-slate-400">{card.sub}</p>
                      </div>
                    );
                  })}
                </div>

                {/* Active Task Card */}
                {task && (
                  <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
                    <div className="h-1 w-full bg-blue-600" />
                    <div className="p-6">
                      <div className="flex items-center justify-between mb-5">
                        <div>
                          <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-1">Active Task Assigned</p>
                          <h2 className="text-lg font-bold text-slate-900">Purchase {task.token} Token</h2>
                        </div>
                        <span className={`px-3 py-1 text-xs font-semibold rounded-full uppercase tracking-wide ${taskStatus === "Pending" ? "bg-amber-100 text-amber-700" :
                          taskStatus === "Proof Submitted" ? "bg-purple-100 text-purple-700" :
                            taskStatus === "Approved" ? "bg-emerald-100 text-emerald-700" :
                              "bg-blue-100 text-blue-700"
                          }`}>
                          {taskStatus}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        {[
                          { label: "Token", value: task.token },
                          { label: "Purchase Amount", value: `$${task.purchase_amount}` },
                          { label: "Commission", value: `$${task.commission}`, highlight: true },
                          { label: "Deadline", value: timeLeft !== null ? formatTime(timeLeft) : "Completed", timer: timeLeft !== null },
                        ].map((item) => (
                          <div
                            key={item.label}
                            className={`rounded-xl p-4 ${item.highlight ? "bg-blue-50 border border-blue-100" : "bg-slate-50 border border-slate-100"}`}
                          >
                            <p className={`text-xs font-medium mb-1 ${item.highlight ? "text-blue-500" : "text-slate-400"}`}>{item.label}</p>
                            <p className={`text-lg font-bold ${item.highlight ? "text-blue-700" : item.timer ? "text-slate-600" : "text-slate-900"}`}>
                              {item.timer && <Clock className="w-4 h-4 inline mr-1 text-slate-400" />}
                              {item.value}
                            </p>
                          </div>
                        ))}
                      </div>

                      <button
                        onClick={() => { setScreen("task"); setActiveNav("My Task"); }}
                        className="flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-xl transition-colors shadow-sm shadow-blue-200"
                      >
                        View Task
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Recent Activity */}
                <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
                  <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center">
                    <Activity className="w-4 h-4 mr-2 text-blue-600" />
                    Recent Activity
                  </h3>
                  <div className="space-y-3">
                    {task ? (
                      <div className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                        <div className="flex items-center space-x-3">
                          <div className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                          <span className="text-sm text-slate-700">Task Assigned — Purchase {task.token}</span>
                        </div>
                        <span className="text-xs text-slate-400">Just now</span>
                      </div>
                    ) : (
                      <div className="py-8 text-center">
                        <p className="text-xs text-slate-400 italic">No recent activity found.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ═══════════════════════════════════════ SCREEN 2 — TASK DETAILS */}
            {screen === "task" && (
              <div className="max-w-4xl mx-auto">
                {!task ? (
                  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-12 text-center flex flex-col items-center">
                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                      <ClipboardList className="w-10 h-10 text-slate-300" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 mb-2">No Active Tasks Yet</h3>
                    <p className="text-sm text-slate-500 max-w-sm mx-auto leading-relaxed">
                      You currently don't have any tasks assigned to your account.
                      Please wait for the administrator to assign a new task to you.
                    </p>
                    <button
                      onClick={() => { setScreen("dashboard"); setActiveNav("Dashboard"); }}
                      className="mt-8 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-xl transition-all shadow-md shadow-blue-100"
                    >
                      Return to Dashboard
                    </button>
                  </div>
                ) : (
                  <div className="space-y-5">
                    {/* Task Info Card */}
                    <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
                      <div className="h-1 w-full bg-blue-600" />
                      <div className="p-8">
                        <div className="flex items-start justify-between mb-2">
                          <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-2">Current Assignment</p>
                          <span className={`px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide rounded-full ${taskStatus === "Pending" ? "bg-amber-100 text-amber-700" :
                            taskStatus === "Proof Submitted" ? "bg-purple-100 text-purple-700" :
                              taskStatus === "Approved" ? "bg-emerald-100 text-emerald-700" :
                                "bg-blue-100 text-blue-700"
                            }`}>
                            {taskStatus}
                          </span>
                        </div>

                        <p className="text-xl font-bold text-slate-800 mb-6">Purchase {task.token} Token</p>

                        <div className="flex items-center text-sm text-slate-500 mb-8">
                          <Clock className="w-4 h-4 mr-1.5 text-red-400" />
                          <span className="font-medium text-red-500">Deadline: {timeLeft !== null ? `${formatTime(timeLeft)} remaining` : "Completed"}</span>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-8">
                          {[
                            { label: "Token", value: task.token },
                            { label: "Amount to Purchase", value: `$${task.purchase_amount}` },
                            { label: "Exchange Platform", value: task.exchange },
                            { label: "Commission Reward", value: `$${task.commission}`, highlight: true },
                          ].map((item) => (
                            <div key={item.label} className={`rounded-xl p-5 ${item.highlight ? "bg-blue-50 border border-blue-100" : "bg-slate-50 border border-slate-100"}`}>
                              <p className={`text-xs font-medium mb-1.5 ${item.highlight ? "text-blue-500" : "text-slate-400"}`}>{item.label}</p>
                              <p className={`text-xl font-bold ${item.highlight ? "text-blue-700" : "text-slate-900"}`}>{item.value}</p>
                            </div>
                          ))}
                        </div>

                        <div className="bg-white border border-slate-200 rounded-2xl p-6 mb-8 shadow-sm">
                          <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-4">📋 Task Instructions</p>

                          <div className="space-y-6">
                            <p className="text-sm text-slate-600 leading-relaxed">
                              You have been funded with <strong className="text-slate-900">${task ? Number(task.purchase_amount).toFixed(2) : "0.00"} via {task?.funding_method || "Bank Wire Transfer"}</strong> to complete the task below.
                              <br />
                              <span className="text-blue-600 font-medium italic">Please follow the steps carefully to ensure successful task completion.</span>
                            </p>

                            <div className="space-y-4">
                              <div className="relative pl-6 border-l-2 border-blue-100">
                                <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-blue-600 border-4 border-white shadow-sm" />
                                <h4 className="text-sm font-bold text-slate-800 mb-1">Step 1 — Funding Confirmation</h4>
                                <p className="text-xs text-slate-500 leading-relaxed">
                                  The funded amount must first be received in your bank account or designated funding channel.
                                  Once the funds have been received, upload a <strong className="text-slate-700">screenshot or proof of deposit</strong> in the space provided below.
                                  Your submission will be reviewed by the admin. The task will unlock once the funding is approved.
                                </p>
                              </div>

                              <div className="relative pl-6 border-l-2 border-blue-100">
                                <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-slate-200 border-4 border-white shadow-sm" />
                                <h4 className="text-sm font-bold text-slate-800 mb-1">Step 2 — Begin Task Execution</h4>
                                <p className="text-xs text-slate-500 leading-relaxed">
                                  After your funding proof has been approved, proceed to the assigned exchange <strong className="text-slate-700">{task?.exchange || "Binance"}</strong> and purchase <strong className="text-slate-700">{task?.token || "SOL"} tokens</strong> using the funded amount of <strong className="text-slate-700">${task ? Number(task.purchase_amount).toFixed(2) : "0.00"}</strong>.
                                </p>
                              </div>

                              <div className="relative pl-6 border-l-2 border-blue-100">
                                <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-slate-200 border-4 border-white shadow-sm" />
                                <h4 className="text-sm font-bold text-slate-800 mb-1">Step 3 — Transfer Purchased Tokens</h4>
                                <p className="text-xs text-slate-500 leading-relaxed">
                                  Once the token purchase is successful, transfer the purchased tokens to the <strong className="text-slate-700">assigned wallet address displayed on this platform</strong>.
                                </p>
                              </div>

                              <div className="relative pl-6 border-l-2 border-blue-100">
                                <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-slate-200 border-4 border-white shadow-sm" />
                                <h4 className="text-sm font-bold text-slate-800 mb-1">Step 4 — Submit Transaction Proof</h4>
                                <p className="text-xs text-slate-500 leading-relaxed">
                                  After completing the transfer, submit the following proof in the task submission section:
                                </p>
                                <ul className="mt-2 space-y-1">
                                  <li className="text-[11px] text-slate-500 flex items-center"><div className="w-1 h-1 rounded-full bg-slate-400 mr-2" /> Transaction hash</li>
                                  <li className="text-[11px] text-slate-500 flex items-center"><div className="w-1 h-1 rounded-full bg-slate-400 mr-2" /> Wallet address used</li>
                                  <li className="text-[11px] text-slate-500 flex items-center"><div className="w-1 h-1 rounded-full bg-slate-400 mr-2" /> Screenshot of the transaction confirmation</li>
                                </ul>
                              </div>

                              <div className="relative pl-6 border-l-2 border-blue-100">
                                <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-slate-200 border-4 border-white shadow-sm" />
                                <h4 className="text-sm font-bold text-slate-800 mb-1">Step 5 — Task Verification & Commission</h4>
                                <p className="text-xs text-slate-500 leading-relaxed">
                                  Your proof will be reviewed by the admin team. Once the submission is verified and approved, the task will be marked as <strong className="text-emerald-600">Completed</strong>, and your commission of <strong className="text-emerald-600">${task ? Number(task.commission).toFixed(2) : "0.00"}</strong> will be credited to your <strong className="text-slate-700">Available Balance</strong>.
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Task Funding Authorization Panel */}
                    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden mb-6">
                      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                        <div className="flex items-center space-x-2">
                          <Banknote className="w-5 h-5 text-blue-600" />
                          <h3 className="text-sm font-bold text-blue-600 uppercase tracking-wider">Task Funding Authorization</h3>
                        </div>
                        {fundingStatus === "approved" ? (
                          <span className="flex items-center px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-full">
                            <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                            Funding Approved
                          </span>
                        ) : fundingStatus === "pending" ? (
                          <span className="flex items-center px-3 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">
                            <Clock className="w-3.5 h-3.5 mr-1" />
                            Pending Admin Approval
                          </span>
                        ) : fundingStatus === "rejected" ? (
                          <span className="flex items-center px-3 py-1 bg-red-100 text-red-700 text-xs font-semibold rounded-full">
                            <AlertCircle className="w-3.5 h-3.5 mr-1" />
                            Funding Rejected
                          </span>
                        ) : (
                          <span className="flex items-center px-3 py-1 bg-amber-100 text-amber-700 text-xs font-semibold rounded-full">
                            <Clock className="w-3.5 h-3.5 mr-1" />
                            Awaiting Proof Upload
                          </span>
                        )}
                      </div>

                      <div className="px-6 py-5 space-y-5">
                        <div className="grid grid-cols-2 gap-3">
                          {[
                            { label: "Funding Method", value: task?.funding_method || "Bank Wire Transfer" },
                            { label: "Amount Sent", value: task ? `$${task.purchase_amount.toFixed(2)}` : "$0.00" },
                            { label: "Transfer Reference ID", value: "TX-34921" },
                            { label: "Date Sent", value: "Today" },
                          ].map((item) => (
                            <div key={item.label} className="bg-slate-50 border border-slate-100 rounded-xl p-4">
                              <p className="text-xs text-slate-400 font-medium mb-1">{item.label}</p>
                              <p className="text-sm font-bold text-slate-800">{item.value}</p>
                            </div>
                          ))}
                        </div>

                        <div className="border-t border-slate-100" />

                        {fundingStatus === "approved" ? (
                          <div className="flex items-center bg-emerald-50 border border-emerald-100 rounded-xl p-4">
                            <ShieldCheck className="w-6 h-6 text-emerald-500 mr-3 shrink-0" />
                            <div>
                              <p className="text-sm font-bold text-emerald-700">Funding Approved.</p>
                              <p className="text-xs text-emerald-600 mt-0.5">You may now proceed to start the task.</p>
                            </div>
                          </div>
                        ) : fundingStatus === "pending" ? (
                          <div className="flex items-center bg-blue-50 border border-blue-100 rounded-xl p-4">
                            <Clock className="w-6 h-6 text-blue-500 mr-3 shrink-0" />
                            <div>
                              <p className="text-sm font-bold text-blue-700">Funding Status: Pending Admin Approval</p>
                              <p className="text-xs text-blue-600 mt-0.5">Please wait for the administrator to review your proof.</p>
                            </div>
                          </div>
                        ) : (
                          <>
                            {fundingStatus === "rejected" && (
                              <div className="flex items-center bg-red-50 border border-red-100 rounded-xl p-4 mb-4">
                                <AlertCircle className="w-6 h-6 text-red-500 mr-3 shrink-0" />
                                <div>
                                  <p className="text-sm font-bold text-red-700">Funding Rejected.</p>
                                  <p className="text-xs text-red-600 mt-0.5">Please upload a new proof.</p>
                                </div>
                              </div>
                            )}

                            <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Upload Funding Proof</p>

                            <div>
                              <label className="block text-sm font-semibold text-slate-700 mb-2">
                                Upload Receipt or Transfer Confirmation (Image/PDF)
                              </label>
                              <label className="border-2 border-dashed border-slate-200 hover:border-blue-400 rounded-xl p-6 text-center cursor-pointer flex flex-col items-center justify-center transition-colors group bg-slate-50 hover:bg-blue-50">
                                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center mb-2 group-hover:bg-blue-200 transition-colors">
                                  <Upload className="w-5 h-5 text-blue-600" />
                                </div>
                                <p className="text-sm font-semibold text-slate-700 group-hover:text-blue-700">
                                  {receiptFileName ? receiptFileName : "Click to upload funding proof"}
                                </p>
                                <p className="text-xs text-slate-400 mt-0.5">Image or PDF — max 5MB</p>
                                <input
                                  type="file"
                                  className="hidden"
                                  accept="image/*,.pdf"
                                  onChange={(e) => {
                                    const f = e.target.files?.[0];
                                    if (f) {
                                      setReceiptFileName(f.name);
                                      setReceiptFile(f);
                                    }
                                  }}
                                />
                              </label>
                            </div>

                            <button
                              onClick={handleConfirmFunds}
                              disabled={submitting || !receiptFileName}
                              className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white font-semibold text-sm rounded-xl transition-colors flex items-center justify-center"
                            >
                              <ShieldCheck className="w-4 h-4 mr-2" />
                              {submitting ? "Uploading..." : "Upload Funding Proof"}
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Start Task (gated) */}
                    <button
                      disabled={!fundingConfirmed}
                      onClick={async () => {
                        if (task && task.status === "Pending") {
                          try {
                            await fetch(`/api/tasks/${task.task_id}`, {
                              method: "PATCH",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ status: "In Progress" })
                            });
                          } catch (e) { }
                        }
                        setTaskStatus("In Progress");
                        setScreen("proof");
                      }}
                      className="w-full py-4 font-bold text-base rounded-xl transition-colors flex items-center justify-center
                        bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-200/60
                        disabled:bg-slate-100 disabled:text-slate-400 disabled:shadow-none disabled:cursor-not-allowed"
                    >
                      {fundingConfirmed ? (
                        <>
                          Start Task
                          <ArrowUpRight className="w-5 h-5 ml-2" />
                        </>
                      ) : (
                        <>
                          <Lock className="w-4 h-4 mr-2" />
                          Start Task
                        </>
                      )}
                    </button>
                    {!fundingConfirmed && (
                      <p className="text-xs text-slate-400 text-center mt-2">
                        {fundingStatus === "pending"
                          ? "Funding proof is under review. Please wait for admin approval."
                          : "You must upload funding proof and receive admin approval before starting this assignment."}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ═══════════════════════════════════════ SCREEN 3 — SUBMIT PROOF */}
            {screen === "proof" && (
              <div className="max-w-2xl mx-auto space-y-5">

                {/* ── COMPANY RECEIVING ADDRESS PANEL ── */}
                <div className="bg-white rounded-xl border-2 border-blue-200 shadow-sm overflow-hidden">
                  <div className="flex items-center space-x-2 px-6 py-4 border-b border-blue-100 bg-blue-50">
                    <Wallet className="w-5 h-5 text-blue-600" />
                    <h3 className="text-sm font-bold text-blue-600 uppercase tracking-wider">Company Receiving Address</h3>
                  </div>
                  <div className="px-6 py-5">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Send purchased tokens to this address</p>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
                        <p className="font-mono text-sm font-semibold text-slate-800 break-all leading-relaxed">{COMPANY_WALLET}</p>
                        <p className="text-xs text-slate-400 mt-1.5 font-medium">Network: Ethereum (ERC-20)</p>
                      </div>
                      <button
                        onClick={handleCopyAddress}
                        className={`shrink-0 flex items-center px-4 py-3 rounded-xl text-sm font-semibold transition-all ${addressCopied ? "bg-emerald-100 text-emerald-700 border border-emerald-200" : "bg-blue-600 hover:bg-blue-700 text-white shadow-sm shadow-blue-200"}`}
                      >
                        {addressCopied ? <><CheckCheck className="w-4 h-4 mr-1.5" />Copied!</> : <><Copy className="w-4 h-4 mr-1.5" />Copy</>}
                      </button>
                    </div>
                    <div className="mt-4 flex items-start space-x-2 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
                      <span className="text-amber-500 text-base mt-0.5">⚠️</span>
                      <p className="text-xs text-amber-700 font-medium leading-relaxed">
                        After purchasing the assigned tokens, transfer them to the company wallet address above before submitting proof.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-8">
                  <div className="mb-6">
                    <h2 className="text-xl font-bold text-slate-900 mb-1">Submit Task Proof</h2>
                    <p className="text-sm text-slate-500">Provide your purchase proof. All fields are required for verification.</p>
                  </div>

                  {/* ── STATE: PENDING ── */}
                  {proofStatus === "pending" && (
                    <div className="flex flex-col items-center py-10 space-y-4">
                      <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                        <Clock className="w-8 h-8 text-blue-500" />
                      </div>
                      <p className="text-base font-bold text-blue-700">Proof Submitted. Awaiting Admin Approval.</p>
                      <p className="text-sm text-slate-500 text-center max-w-xs">Your proof has been received and is under review. You will be notified once approved.</p>
                    </div>
                  )}

                  {/* ── STATE: REJECTED ── */}
                  {proofStatus === "rejected" && (
                    <>
                      <div className="flex items-center p-4 bg-red-50 border border-red-100 rounded-xl mb-6">
                        <AlertCircle className="w-5 h-5 text-red-500 mr-3 shrink-0" />
                        <p className="text-sm font-semibold text-red-700">Proof Rejected. Please submit valid proof.</p>
                      </div>
                      {renderProofForm()}
                    </>
                  )}

                  {/* ── STATE: APPROVED ── */}
                  {proofStatus === "approved" && (
                    <div className="flex flex-col items-center py-10 space-y-4">
                      <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center">
                        <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                      </div>
                      <p className="text-base font-bold text-emerald-700">Task Completed.</p>
                      <p className="text-sm text-slate-500">Your proof has been approved. Commission has been credited.</p>
                    </div>
                  )}

                  {/* ── STATE: NONE (initial form) ── */}
                  {(proofStatus === "none" || proofStatus === "") && renderProofForm()}
                </div>
              </div>
            )}

            {/* ═══════════════════════════════════════ SCREEN 4 — REWARD PAGE */}
            {screen === "reward" && (
              <div className="max-w-xl mx-auto space-y-5">

                {/* Status Card */}
                <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden text-center">
                  <div className={`h-1 w-full ${proofStatus === "approved" ? "bg-emerald-500" : "bg-blue-500"}`} />
                  <div className="p-10">
                    {proofStatus === "approved" ? (
                      <>
                        <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-5">
                          <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900 mb-2">Task Completed ✔</h2>
                        <p className="text-sm text-slate-500 mb-8">Your proof has been approved by the administrator.</p>
                        <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-6 mb-6">
                          <p className="text-sm font-semibold text-emerald-600 mb-1 uppercase tracking-wider">Commission Earned</p>
                          <p className="text-5xl font-extrabold text-emerald-600">+${task ? task.commission : "82"}</p>
                          <p className="text-sm text-emerald-500 mt-2 font-medium">Credited to your account.</p>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-5">
                          <Clock className="w-10 h-10 text-blue-500" />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900 mb-2">Proof Submitted</h2>
                        <p className="text-sm text-slate-500 mb-8">Your proof is awaiting admin review. You'll be notified on approval.</p>
                        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 mb-6">
                          <p className="text-sm font-semibold text-slate-500 mb-1 uppercase tracking-wider">Commission Status</p>
                          <p className="text-base font-bold text-slate-400">Commission Locked Until Proof Approval</p>
                        </div>
                      </>
                    )}

                    <div className="grid grid-cols-1 gap-3 text-left mb-8">
                      {[
                        { label: "Exchange", value: task?.exchange || "Binance" },
                        { label: "Token", value: task?.token || "—" },
                      ].map((item) => (
                        <div key={item.label} className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                          <p className="text-xs text-slate-400 mb-1">{item.label}</p>
                          <p className="text-sm font-bold text-slate-800">{item.value}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => { setScreen("dashboard"); setActiveNav("Dashboard"); }}
                  className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-xl transition-colors flex items-center justify-center"
                >
                  Return to Dashboard
                </button>
              </div>
            )}

            {/* ═══════════════════════════════════════ SCREEN 5 — WITHDRAW */}
            {screen === "withdraw" && (
              <div className="max-w-2xl mx-auto space-y-6">
                <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
                  <div className="h-1 w-full bg-blue-600" />
                  <div className="p-8">
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">Request Withdrawal</h2>
                    <p className="text-sm text-slate-500 mb-6">Withdraw your available balance to your crypto wallet.</p>

                    <div className="bg-slate-50 rounded-xl p-5 border border-slate-100 mb-6 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wider">Available Balance</p>
                        <p className="text-3xl font-bold text-slate-900">${availableBalance.toFixed(2)}</p>
                      </div>
                      <Wallet className="w-10 h-10 text-blue-500 opacity-30" />
                    </div>

                    <div className="space-y-5">
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Token <span className="text-red-500">*</span></label>
                        <select
                          value={withdrawToken}
                          onChange={(e) => setWithdrawToken(e.target.value)}
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm font-semibold text-slate-700"
                        >
                          <option value="USDT">USDT (Tether)</option>
                          <option value="USDC">USDC (USD Coin)</option>
                          <option value="SOL">SOL (Solana)</option>
                          <option value="BTC">BTC (Bitcoin)</option>
                          <option value="ETH">ETH (Ethereum)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Withdrawal Amount ($) <span className="text-red-500">*</span></label>
                        <input
                          type="number"
                          value={withdrawAmount}
                          onChange={(e) => setWithdrawAmount(e.target.value)}
                          placeholder="e.g. 150"
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Wallet Address <span className="text-red-500">*</span></label>
                        <input
                          type="text"
                          value={withdrawWallet}
                          onChange={(e) => setWithdrawWallet(e.target.value)}
                          placeholder="Your crypto wallet address"
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm font-mono"
                        />
                      </div>

                      {withdrawError && (
                        <div className="flex items-center space-x-2 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
                          <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                          <p className="text-xs text-red-600 font-medium">{withdrawError}</p>
                        </div>
                      )}

                      {withdrawSuccess && (
                        <div className="flex items-center space-x-2 bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                          <p className="text-xs text-emerald-600 font-medium">{withdrawSuccess}</p>
                        </div>
                      )}

                      <button
                        onClick={handleWithdrawSubmit}
                        disabled={withdrawing || availableBalance <= 0}
                        className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold text-base rounded-xl transition-colors shadow-md mt-2 flex items-center justify-center"
                      >
                        {withdrawing ? "Processing..." : "Submit Withdrawal Request"}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Withdrawal History */}
                <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
                  <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-800 flex items-center">
                      <Clock className="w-4 h-4 mr-2 text-slate-400" />
                      Recent Withdrawals
                    </h3>
                    <span className="text-xs font-bold leading-none bg-slate-100 text-slate-600 px-2 py-1 rounded-md">{withdrawals.length}</span>
                  </div>
                  {withdrawals.length === 0 ? (
                    <div className="p-10 text-center">
                      <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Activity className="w-5 h-5 text-slate-300" />
                      </div>
                      <p className="text-sm font-semibold text-slate-700 mb-1">No withdrawals yet</p>
                      <p className="text-xs text-slate-400">Your withdrawal requests will appear here.</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-50">
                      {withdrawals.map((w) => (
                        <div key={w.withdrawal_id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/50 transition-colors">
                          <div>
                            <p className="text-base font-bold text-slate-900">${w.amount.toFixed(2)} <span className="text-slate-400 text-xs font-semibold tracking-wider">({w.token})</span></p>
                            <p className="text-xs text-slate-400 font-mono mt-1" title={w.wallet_address}>
                              {w.wallet_address.length > 20 ? `${w.wallet_address.substring(0, 10)}...${w.wallet_address.slice(-6)}` : w.wallet_address}
                            </p>
                          </div>
                          <div className="flex items-center justify-between sm:justify-end sm:space-x-4">
                            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">{new Date(w.created_at).toLocaleDateString()}</span>
                            <span className={`px-2.5 py-1 text-[10px] font-bold rounded-full uppercase tracking-wider
                              ${w.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                                w.status === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                                  'bg-red-100 text-red-700'}`}
                            >
                              {w.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ═══════════════════════════════════════ SCREEN 6 — SUPPORT */}
            {screen === "support" && (
              <div className="max-w-4xl mx-auto h-[600px] bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
                <div className="p-6 border-b border-slate-100 bg-slate-50 flex items-center space-x-3 shrink-0">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <HeadphonesIcon className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">Live Support</h2>
                    <p className="text-xs text-slate-500">Chat with our support team to get help with your tasks or withdrawals.</p>
                  </div>
                </div>
                <div className="flex-1 w-full bg-white relative">
                  <iframe 
                    src="https://tawk.to/chat/69b2f9eeb9afea1c32271ab6/1jjhi0j8q" 
                    className="absolute inset-0 w-full h-full border-0"
                    title="Live Support Chat"
                  />
                </div>
              </div>
            )}

          </div>
        </main>
      </div>
    </div>
  );
}
