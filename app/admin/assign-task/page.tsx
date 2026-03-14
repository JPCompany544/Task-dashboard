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
  Wallet,
  Menu,
  X,
} from "lucide-react";
import Link from "next/link";

type AdminNav = "Dashboard" | "Employees" | "Assign Task" | "Proof Approvals" | "Funding Logs" | "Withdrawals" | "Settings";

interface Employee {
  employee_id: string;
  name: string;
  email: string;
}

interface Task {
  task_id: string;
  employee_id: string;
  token: string;
  purchase_amount: number;
  commission: number;
  deadline: string;
  status: string;
  created_at: string;
}

export default function AssignTaskPage() {
  const router = useRouter();
  const [activeNav, setActiveNav] = useState<AdminNav>("Assign Task");

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Form State
  const [formEmployeeId, setFormEmployeeId] = useState("");
  const [formToken, setFormToken] = useState("SOL");
  const [formAmount, setFormAmount] = useState<string>("900");
  const [formExchange, setFormExchange] = useState("Binance");
  const [formCommission, setFormCommission] = useState<string>("82");
  const [formFundingMethod, setFormFundingMethod] = useState("Bank Wire Transfer");

  // Create a default deadline (tomorrow) formatted for datetime-local input
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  // datetime-local format: YYYY-MM-DDThh:mm
  const defaultDeadline = new Date(tomorrow.getTime() - (tomorrow.getTimezoneOffset() * 60000)).toISOString().slice(0, 16);
  const [formDeadline, setFormDeadline] = useState(defaultDeadline);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [successMessage, setSuccessMessage] = useState<{
    name: string;
    token: string;
    amount: string;
    commission: string;
  } | null>(null);

  const handleLogout = () => {
    clearSessionCookie();
    router.push("/admin/login");
  };

  const navItems: { name: AdminNav; icon: React.ElementType; href: string }[] = [
    { name: "Dashboard", icon: LayoutDashboard, href: "/admin/dashboard" },
    { name: "Employees", icon: Users, href: "/admin/employees" },
    { name: "Assign Task", icon: ClipboardList, href: "/admin/assign-task" },
    { name: "Proof Approvals", icon: ShieldCheck, href: "/admin/proof-approvals" },
    { name: "Funding Logs", icon: Banknote, href: "/admin/funding-authorizations" },
    { name: "Withdrawals", icon: Wallet, href: "/admin/withdrawals" },
    { name: "Settings", icon: Settings, href: "#" },
  ];

  // Fetch Employees and Tasks
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [empRes, taskRes] = await Promise.all([
          fetch("/api/employees"),
          fetch("/api/tasks")
        ]);

        if (empRes.ok) {
          const empData = await empRes.json();
          setEmployees(empData);
        }
        if (taskRes.ok) {
          const taskData = await taskRes.json();
          setTasks(taskData);
        }
      } catch (err) {
        console.error("Failed to fetch initial data", err);
      } finally {
        setLoadingTasks(false);
      }
    };

    fetchInitialData();
    const interval = setInterval(fetchInitialData, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setSuccessMessage(null);

    if (!formEmployeeId) {
      setFormError("Please select an employee.");
      return;
    }
    if (!formToken || !formAmount || !formExchange || (!formCommission && formCommission !== "0") || !formDeadline) {
      setFormError("Please fill out all task assignment fields.");
      return;
    }

    setIsSubmitting(true);
    try {
      // Force valid ISO string mapping for sqlite compatibility
      const deadlineDate = new Date(formDeadline).toISOString();

      const payload = {
        employee_id: formEmployeeId,
        token: formToken,
        purchase_amount: Number(formAmount),
        exchange: formExchange,
        commission: Number(formCommission),
        funding_method: formFundingMethod,
        deadline: deadlineDate
      };

      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!res.ok) {
        setFormError(data.error || "Failed to assign task");
        setIsSubmitting(false);
        return;
      }

      // Success
      setTasks(prev => [data, ...prev]);

      const emp = employees.find(e => e.employee_id === formEmployeeId);
      setSuccessMessage({
        name: emp ? emp.name : formEmployeeId,
        token: formToken,
        amount: formAmount,
        commission: formCommission
      });

      // Clear main fields
      setFormEmployeeId("");
    } catch (err) {
      setFormError("Network error occurred while assigning task.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Pending":
        return "bg-amber-100 text-amber-700";
      case "Started":
      case "In Progress":
        return "bg-blue-100 text-blue-700";
      case "Proof Submitted":
      case "Awaiting Approval":
        return "bg-purple-100 text-purple-700";
      case "Approved":
      case "Completed":
        return "bg-emerald-100 text-emerald-700";
      default:
        return "bg-slate-100 text-slate-700";
    }
  };

  const computeStatusLabel = (status: string) => {
    if (status === "In Progress") return "Started";
    if (status === "Awaiting Approval") return "Proof Submitted";
    return status;
  };

  const calculateTimeLeft = (deadlineISO: string) => {
    const diffMs = new Date(deadlineISO).getTime() - Date.now();
    if (diffMs <= 0) return "Expired";

    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    if (diffHours > 24) {
      const days = Math.floor(diffHours / 24);
      return `${days} day${days > 1 ? 's' : ''} left`;
    }
    if (diffHours > 0) {
      return `${diffHours} hr ${diffMins} min left`;
    }
    return `${diffMins} min remaining`;
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
                  <span className="text-white text-xs font-bold">OC</span>
                </div>
                <span className="text-sm font-bold text-slate-800 tracking-tight">OpsControl</span>
              </div>
              <button onClick={() => setIsSidebarOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
              {navItems.map((item) => {
                const isActive = activeNav === item.name;
                return (
                  <Link
                    href={item.href}
                    key={item.name}
                    onClick={() => setIsSidebarOpen(false)}
                    className={`w-full flex items-center px-4 py-3 rounded-xl transition-all duration-150 text-sm ${isActive
                      ? "bg-blue-50 text-blue-600 font-bold"
                      : "text-slate-500 hover:bg-slate-50 hover:text-slate-800 font-medium"
                    }`}
                  >
                    <item.icon className={`w-5 h-5 mr-3 ${isActive ? "text-blue-600" : "text-slate-400"}`} />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>

            <div className="px-4 py-4 border-t border-slate-100 bg-slate-50/50">
              <button onClick={handleLogout} className="w-full flex items-center justify-between px-3 py-3 text-sm font-bold text-slate-500 hover:text-red-500 transition-colors">
                <div className="flex items-center">
                  <LogOut className="w-5 h-5 mr-3" />
                  Logout
                </div>
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* ── DESKTOP SIDEBAR ── */}
      <aside className="w-[240px] bg-white border-r border-slate-100 hidden md:flex flex-col shrink-0">
        <div className="px-6 py-5 border-b border-slate-100">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white text-xs font-bold">OC</span>
            </div>
            <span className="text-sm font-bold text-slate-800 tracking-tight">OpsControl</span>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {navItems.map((item) => {
            const isActive = activeNav === item.name;
            return (
              <Link
                href={item.href}
                key={item.name}
                className={`w-full flex items-center px-3 py-2.5 rounded-lg transition-all duration-150 text-sm ${isActive
                  ? "bg-blue-50 text-blue-600 font-semibold"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-800 font-medium"
                  }`}
              >
                <item.icon className={`w-4 h-4 mr-3 ${isActive ? "text-blue-600" : "text-slate-400"}`} />
                <span>{item.name}</span>
                {isActive && <div className="ml-auto w-1.5 h-1.5 bg-blue-600 rounded-full" />}
              </Link>
            );
          })}
        </nav>

        <div className="px-4 py-4 border-t border-slate-100">
          <button onClick={handleLogout} className="w-full flex items-center justify-between px-3 py-2 text-sm font-semibold text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100">
            <div className="flex items-center">
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </div>
          </button>
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
              <h1 className="text-sm md:text-base font-semibold text-slate-800 truncate">Assign Task</h1>
              <div className="hidden sm:flex items-center text-[10px] md:text-xs text-slate-400 space-x-1 sm:ml-2">
                <span>Admin</span>
                <ChevronRight className="w-3 h-3" />
                <span className="text-blue-600 font-medium">Assign Task</span>
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
              <h2 className="text-2xl font-bold text-slate-900">Task Creation</h2>
            </div>

            {/* Form Section */}
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-8">
              {successMessage ? (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6 text-center mb-6">
                  <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                  </div>
                  <h3 className="text-lg font-bold text-emerald-800 mb-2">Task Assigned Successfully</h3>
                  <div className="inline-block text-left bg-white border border-emerald-100 rounded-lg p-4 mt-2">
                    <p className="text-sm text-slate-600"><span className="font-semibold text-slate-800">Employee:</span> {successMessage.name}</p>
                    <p className="text-sm text-slate-600"><span className="font-semibold text-slate-800">Token:</span> {successMessage.token}</p>
                    <p className="text-sm text-slate-600"><span className="font-semibold text-slate-800">Purchase Amount:</span> ${successMessage.amount}</p>
                    <p className="text-sm text-slate-600"><span className="font-semibold text-slate-800">Commission:</span> ${successMessage.commission}</p>
                  </div>
                  <div className="mt-5">
                    <button
                      onClick={() => setSuccessMessage(null)}
                      className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm rounded-lg transition-colors"
                    >
                      Assign Another Task
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleCreateTask} className="space-y-6">
                  {formError && (
                    <div className="p-4 bg-red-50 border border-red-100 rounded-lg text-sm text-red-600 font-medium">
                      {formError}
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Employee */}
                    <div className="col-span-1 md:col-span-2 lg:col-span-1">
                      <label className="block text-sm font-semibold text-slate-700 mb-1.5">Employee</label>
                      <select
                        value={formEmployeeId}
                        onChange={(e) => setFormEmployeeId(e.target.value)}
                        className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm bg-white"
                      >
                        <option value="" disabled>Select Employee</option>
                        {employees.map(emp => (
                          <option key={emp.employee_id} value={emp.employee_id}>
                            {emp.name} ({emp.employee_id})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Token */}
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1.5">Token</label>
                      <input
                        type="text"
                        value={formToken}
                        onChange={(e) => setFormToken(e.target.value)}
                        placeholder="e.g. SOL"
                        className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm"
                      />
                    </div>

                    {/* Purchase Amount */}
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1.5">Purchase Amount ($)</label>
                      <input
                        type="number"
                        min="1"
                        step="0.01"
                        value={formAmount}
                        onChange={(e) => setFormAmount(e.target.value)}
                        placeholder="900"
                        className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm"
                      />
                    </div>

                    {/* Exchange */}
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1.5">Exchange</label>
                      <input
                        type="text"
                        value={formExchange}
                        onChange={(e) => setFormExchange(e.target.value)}
                        placeholder="Binance"
                        className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm"
                      />
                    </div>

                    {/* Commission Reward */}
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1.5">Commission Reward ($)</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={formCommission}
                        onChange={(e) => setFormCommission(e.target.value)}
                        placeholder="82"
                        className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm"
                      />
                    </div>

                    {/* Funding Method */}
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1.5">Funding Method</label>
                      <select
                        value={formFundingMethod}
                        onChange={(e) => setFormFundingMethod(e.target.value)}
                        className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm bg-white"
                      >
                        <option value="Bank Wire Transfer">Bank Wire Transfer</option>
                        <option value="Zelle">Zelle</option>
                        <option value="Crypto Transfer">Crypto Transfer</option>
                        <option value="Company Debit Card">Company Debit Card</option>
                      </select>
                    </div>

                    {/* Deadline */}
                    <div className="col-span-1 md:col-span-2 lg:col-span-1">
                      <label className="block text-sm font-semibold text-slate-700 mb-1.5">Deadline</label>
                      <input
                        type="datetime-local"
                        value={formDeadline}
                        onChange={(e) => setFormDeadline(e.target.value)}
                        className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm"
                      />
                    </div>
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-8 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-semibold text-sm rounded-lg transition-colors shadow-sm shadow-blue-200/50"
                    >
                      {isSubmitting ? "Creating Task..." : "Create Task"}
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* Task Monitor Table */}
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                <h3 className="text-base font-bold text-slate-800">All Tasks</h3>
              </div>
              <div className="w-full overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">Employee</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">Token</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">Purchase Amount</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">Commission</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">Deadline</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {loadingTasks ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-8 text-center text-slate-500 text-sm">Loading tasks...</td>
                      </tr>
                    ) : tasks.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-8 text-center text-slate-500 text-sm">No tasks assigned yet.</td>
                      </tr>
                    ) : (
                      tasks.map((task) => {
                        const emp = employees.find(e => e.employee_id === task.employee_id);
                        return (
                          <tr key={task.task_id} className="hover:bg-slate-50/70 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <p className="text-sm font-semibold text-slate-800">{emp ? emp.name : "Unknown Employee"}</p>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <p className="text-sm font-semibold text-slate-700">{task.token}</p>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <p className="text-sm text-slate-600">${Number(task.purchase_amount).toFixed(2)}</p>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <p className="text-sm font-semibold text-emerald-600">${Number(task.commission).toFixed(2)}</p>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <p className="text-sm text-slate-500">
                                {calculateTimeLeft(task.deadline)}
                              </p>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${getStatusBadge(task.status)}`}>
                                {computeStatusLabel(task.status)}
                              </span>
                            </td>
                          </tr>
                        );
                      })
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
