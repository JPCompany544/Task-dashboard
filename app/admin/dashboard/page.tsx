"use client";

import React, { useState } from "react";
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
  ChevronRight,
  Activity,
  Clock,
  CheckCircle2,
  AlertCircle,
  UserPlus,
  ListTodo,
  Eye,
  TrendingUp,
  DollarSign,
  FileCheck,
  LogOut,
  ArrowUpRight,
  EyeOff,
  Wallet,
  Menu,
  X,
} from "lucide-react";
import Link from "next/link";

import { useEffect } from "react";

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
  funding_status: string;
  created_at: string;
}

const statusStyle: Record<string, string> = {
  "Pending":          "bg-slate-100 text-slate-600",
  "In Progress":      "bg-blue-100 text-blue-700",
  "Proof Submitted": "bg-purple-100 text-purple-700",
  "Approved":         "bg-emerald-100 text-emerald-700",
  "Rejected":         "bg-red-100 text-red-700",
};

export default function AdminDashboard() {
  const router = useRouter();
  const [activeNav, setActiveNav] = useState<"Dashboard" | "Employees" | "Assign Task" | "Proof Approvals" | "Funding Logs" | "Withdrawals" | "Settings">("Dashboard");
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [empRes, taskRes] = await Promise.all([
          fetch("/api/employees"),
          fetch("/api/tasks")
        ]);
        if (empRes.ok) setEmployees(await empRes.json());
        if (taskRes.ok) setTasks(await taskRes.json());
      } catch (e) {
        console.error("Error fetching data:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    const interval = setInterval(fetchData, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    clearSessionCookie();
    router.push("/admin/login");
  };

  const navItems: { name: string; icon: React.ElementType; href: string }[] = [
    { name: "Dashboard",       icon: LayoutDashboard, href: "/admin/dashboard" },
    { name: "Employees",       icon: Users,           href: "/admin/employees" },
    { name: "Assign Task",     icon: ClipboardList,   href: "/admin/assign-task" },
    { name: "Proof Approvals", icon: ShieldCheck,     href: "/admin/proof-approvals" },
    { name: "Funding Logs",    icon: Banknote,        href: "/admin/funding-authorizations" },
    { name: "Withdrawals",     icon: Wallet,          href: "/admin/withdrawals" },
    { name: "Settings",        icon: Settings,        href: "#" },
  ];

  const totalEmployees = employees.length;
  const activeTasksCount = tasks.filter(t => ["Pending", "In Progress"].includes(t.status)).length;
  const pendingProofsCount = tasks.filter(t => t.status === "Proof Submitted").length;
  const totalCommission = tasks
    .filter(t => t.status === "Approved")
    .reduce((sum, t) => sum + Number(t.commission), 0);

  const stats = [
    { label: "Total Employees",       value: totalEmployees.toString(),    icon: Users,        color: "bg-blue-50 text-blue-600" },
    { label: "Active Tasks",          value: activeTasksCount.toString(),     icon: ListTodo,     color: "bg-violet-50 text-violet-600" },
    { label: "Pending Proofs",        value: pendingProofsCount.toString(),     icon: FileCheck,    color: "bg-amber-50 text-amber-600" },
    { label: "Commission Paid",       value: `$${totalCommission.toLocaleString()}`, icon: DollarSign,  color: "bg-emerald-50 text-emerald-600" },
  ];

  const calculateTimeLeft = (deadlineISO: string) => {
    const diffMs = new Date(deadlineISO).getTime() - Date.now();
    if (diffMs <= 0) return "Expired";
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return diffHours > 0 ? `${diffHours}h ${diffMins}m left` : `${diffMins}m left`;
  };

  const activeTasks = tasks.filter(t => ["Pending", "In Progress"].includes(t.status)).slice(0, 5);
  const pendingProofs = tasks.filter(t => t.status === "Proof Submitted").slice(0, 5);

  return (
    <div className="flex h-screen bg-slate-50 font-sans overflow-hidden">

      {/* ── MOBILE OVERLAY SIDEBAR ── */}
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
                const isActive = activeNav === item.name;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setIsSidebarOpen(false)}
                    className={`w-full flex items-center px-4 py-3 rounded-xl transition-all duration-150 text-sm ${
                      isActive
                        ? "bg-blue-50 text-blue-600 font-bold"
                        : "text-slate-500 hover:bg-slate-50 hover:text-slate-800 font-medium"
                    }`}
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
                    <p className="text-xs font-bold text-slate-800 truncate">Admin User</p>
                    <p className="text-[10px] text-slate-400 truncate">admin@employeecore.io</p>
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
            const isActive = activeNav === item.name;
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
              <p className="text-xs text-slate-400 truncate">admin@employeecore.io</p>
            </div>
            <button onClick={handleLogout} title="Logout" className="text-slate-300 hover:text-red-500 transition-colors p-1 shrink-0">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* ── MAIN WRAPPER ── */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* ── TOP HEADER ── */}
        <header className="bg-white border-b border-slate-100 h-16 flex items-center justify-between px-4 md:px-8 shrink-0">
          <div className="flex items-center">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 mr-3 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg md:hidden"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-sm md:text-base font-semibold text-slate-800 truncate">Admin Dashboard</h1>
              <p className="text-[10px] md:text-xs text-slate-400 truncate">Operations Control Center</p>
            </div>
          </div>
          <div className="flex items-center space-x-2 md:space-x-4">
            <button className="relative p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
              <Bell className="w-4 h-4 md:w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 md:w-2 md:h-2 bg-red-500 rounded-full border-2 border-white" />
            </button>
            <div className="w-7 h-7 md:w-8 md:h-8 bg-blue-600 rounded-full flex items-center justify-center shrink-0">
              <span className="text-white text-[10px] md:text-xs font-bold">AD</span>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center px-2 py-1.5 md:px-3 text-[10px] md:text-xs font-semibold text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-slate-200 hover:border-red-200"
            >
              <LogOut className="w-3.5 h-3.5 md:mr-1.5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </header>

        {/* ── MAIN CONTENT ── */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-slate-50">
          <div className="max-w-6xl mx-auto space-y-6">

            {/* ── SECTION 1: OVERVIEW STATS ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {stats.map((s) => (
                <div key={s.label} className="bg-white rounded-xl p-5 border border-slate-100 shadow-sm">
                  <div className="flex items-start justify-between mb-3">
                    <p className="text-xs font-medium text-slate-500">{s.label}</p>
                    <div className={`p-2 rounded-lg ${s.color}`}>
                      <s.icon className="w-4 h-4" />
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-slate-900 mb-0.5">{s.value}</p>
                  <div className="flex items-center text-xs text-emerald-600 font-medium">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    Live
                  </div>
                </div>
              ))}
            </div>

            {/* ── SECTION 2 + 5 side by side ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

              {/* SECTION 2 — ACTIVE TASK MONITOR (2/3 width) */}
              <div className="lg:col-span-2 bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                  <h2 className="text-sm font-bold text-blue-600 uppercase tracking-wider flex items-center">
                    <ListTodo className="w-4 h-4 mr-2" />
                    Active Tasks
                  </h2>
                  <span className="text-xs font-semibold text-slate-400">{activeTasksCount} tasks</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-100 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                        <th className="px-6 py-3 text-left">Employee ID</th>
                        <th className="px-4 py-3 text-left">Task</th>
                        <th className="px-4 py-3 text-left">Amount</th>
                        <th className="px-4 py-3 text-left">Commission</th>
                        <th className="px-4 py-3 text-left">Deadline</th>
                        <th className="px-4 py-3 text-left">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {!loading && activeTasks.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-6 py-8 text-center text-slate-400 text-xs">No active tasks found.</td>
                        </tr>
                      ) : (
                        activeTasks.map((row, i) => (
                          <tr
                            key={i}
                            className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                          >
                            <td className="px-6 py-3.5">
                              <span className="font-semibold text-slate-800 text-xs font-mono">{row.employee_id}</span>
                            </td>
                            <td className="px-4 py-3.5 text-xs text-slate-600 font-medium">Purchase {row.token}</td>
                            <td className="px-4 py-3.5 text-xs font-bold text-slate-900">${Number(row.purchase_amount).toLocaleString()}</td>
                            <td className="px-4 py-3.5 text-xs font-bold text-emerald-600">${Number(row.commission).toLocaleString()}</td>
                            <td className="px-4 py-3.5">
                              <div className="flex items-center text-xs text-slate-500">
                                <Clock className="w-3 h-3 mr-1 text-slate-400 shrink-0" />
                                {calculateTimeLeft(row.deadline)}
                              </div>
                            </td>
                            <td className="px-4 py-3.5">
                              <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wide ${statusStyle[row.status]}`}>
                                {row.status === "Pending" && row.funding_status === "pending" ? "Funding Review" : row.status}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* SECTION 5 — RECENT ACTIVITY (1/3 width) */}
              <div className="bg-white rounded-xl border border-slate-100 shadow-sm">
                <div className="px-6 py-4 border-b border-slate-100">
                  <h2 className="text-sm font-bold text-blue-600 uppercase tracking-wider flex items-center">
                    <Activity className="w-4 h-4 mr-2" />
                    Platform Status
                  </h2>
                </div>
                <div className="px-6 py-4 space-y-4">
                  <div className="flex items-center justify-between py-2 border-b border-slate-50">
                    <span className="text-xs text-slate-500 font-medium">System Health</span>
                    <span className="flex items-center text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                      <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-1.5 animate-pulse" />
                      OPERATIONAL
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-slate-50">
                    <span className="text-xs text-slate-500 font-medium">Data Sync</span>
                    <span className="text-[10px] font-bold text-blue-600">LIVE POLLING</span>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span className="text-xs text-slate-500 font-medium">Database</span>
                    <span className="text-[10px] font-bold text-slate-700 font-mono text-right">SQLITE_V3_ACTIVE</span>
                  </div>
                  <div className="pt-2">
                    <p className="text-[10px] text-slate-400 italic text-center">Admin controlled platform environment</p>
                  </div>
                </div>
              </div>
            </div>

            {/* ── SECTION 3 + 4 side by side ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

              {/* SECTION 3 — PENDING PROOFS (2/3 width) */}
              <div className="lg:col-span-2 bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                  <h2 className="text-sm font-bold text-blue-600 uppercase tracking-wider flex items-center">
                    <FileCheck className="w-4 h-4 mr-2" />
                    Pending Proof Submissions
                  </h2>
                  <span className="px-2.5 py-1 bg-amber-100 text-amber-700 text-xs font-semibold rounded-full">
                    {pendingProofsCount} pending
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-100 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                        <th className="px-6 py-3 text-left">Employee ID</th>
                        <th className="px-4 py-3 text-left">Token</th>
                        <th className="px-4 py-3 text-left">Submitted</th>
                        <th className="px-4 py-3 text-left">Status</th>
                        <th className="px-4 py-3 text-left">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {!loading && pendingProofs.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-6 py-8 text-center text-slate-400 text-xs">No pending proofs to review.</td>
                        </tr>
                      ) : (
                        pendingProofs.map((row, i) => (
                          <tr key={i} className="hover:bg-slate-50/80 transition-colors">
                            <td className="px-6 py-4">
                              <span className="font-semibold text-slate-800 text-xs font-mono">{row.employee_id}</span>
                            </td>
                            <td className="px-4 py-4 text-xs text-slate-600 font-medium">{row.token}</td>
                            <td className="px-4 py-4 text-xs text-slate-500">Wait Approval</td>
                            <td className="px-4 py-4">
                              <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wide ${statusStyle[row.status]}`}>
                                {row.status}
                              </span>
                            </td>
                            <td className="px-4 py-4">
                              <Link 
                                href="/admin/assign-task"
                                className="flex items-center px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors inline-block text-center"
                              >
                                View Task
                              </Link>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* SECTION 4 — QUICK ACTIONS (1/3 width) */}
              <div className="bg-white rounded-xl border border-slate-100 shadow-sm">
                <div className="px-6 py-4 border-b border-slate-100">
                  <h2 className="text-sm font-bold text-blue-600 uppercase tracking-wider">Quick Actions</h2>
                </div>
                <div className="px-6 py-5 space-y-3">
                  <Link
                    href="/admin/employees"
                    className="w-full flex items-center justify-between px-4 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors shadow-sm shadow-blue-200 group"
                  >
                    <div className="flex items-center">
                      <UserPlus className="w-4 h-4 mr-3" />
                      <span className="text-sm font-semibold">Create Employee</span>
                    </div>
                    <ChevronRight className="w-4 h-4 opacity-60 group-hover:translate-x-0.5 transition-transform" />
                  </Link>

                  <Link
                    href="/admin/assign-task"
                    className="w-full flex items-center justify-between px-4 py-3.5 bg-white hover:bg-blue-50 text-slate-700 border border-slate-200 hover:border-blue-300 rounded-xl transition-colors group"
                  >
                    <div className="flex items-center">
                      <ClipboardList className="w-4 h-4 mr-3 text-blue-600" />
                      <span className="text-sm font-semibold">Assign Task</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-blue-400 group-hover:translate-x-0.5 transition-all" />
                  </Link>

                  <Link
                    href="/admin/employees"
                    className="w-full flex items-center justify-between px-4 py-3.5 bg-white hover:bg-blue-50 text-slate-700 border border-slate-200 hover:border-blue-300 rounded-xl transition-colors group"
                  >
                    <div className="flex items-center">
                      <Users className="w-4 h-4 mr-3 text-blue-600" />
                      <span className="text-sm font-semibold">Manage Employees</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-blue-400 group-hover:translate-x-0.5 transition-all" />
                  </Link>

                  {/* Summary strip */}
                  <div className="mt-2 pt-4 border-t border-slate-100 space-y-2.5">
                    {[
                      { label: "Approvals Today", value: "5", icon: CheckCircle2, color: "text-emerald-500" },
                      { label: "Alerts",           value: "2", icon: AlertCircle,  color: "text-amber-500" },
                    ].map((item) => (
                      <div key={item.label} className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <item.icon className={`w-3.5 h-3.5 ${item.color}`} />
                          <span className="text-xs text-slate-500">{item.label}</span>
                        </div>
                        <span className="text-xs font-bold text-slate-800">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
