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
  UserPlus,
  X,
  Copy,
  CheckCheck,
  ChevronRight,
  Eye,
  Search,
  BadgeCheck,
  XCircle,
  LogOut,
  Loader2,
  Wallet,
} from "lucide-react";
import Link from "next/link";

type AdminNav = "Dashboard" | "Employees" | "Assign Task" | "Proof Approvals" | "Funding Logs" | "Withdrawals" | "Settings";

interface Employee {
  id?: number;
  name: string;
  email: string;
  employee_id: string;
  status: "Active" | "Suspended";
  active_task: boolean;
  created_at: string;
}

export default function EmployeeManager() {
  const router = useRouter();
  const [activeNav, setActiveNav] = useState<AdminNav>("Employees");
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loadingEmployees, setLoadingEmployees] = useState(true);
  const [search, setSearch] = useState("");

  const handleLogout = () => {
    clearSessionCookie();
    router.push("/admin/login");
  };

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const res = await fetch("/api/employees");
        if (res.ok) {
          const data = await res.json();
          setEmployees(data);
        }
      } catch (err) {
        console.error("Failed to fetch employees", err);
      } finally {
        setLoadingEmployees(false);
      }
    };
    fetchEmployees();
  }, []);

  // Modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Success state
  const [createdEmployee, setCreatedEmployee] = useState<Employee | null>(null);
  const [credentialsCopied, setCredentialsCopied] = useState(false);

  // Detail panel state
  const [viewEmployee, setViewEmployee] = useState<Employee | null>(null);

  const navItems: { name: AdminNav; icon: React.ElementType; href: string }[] = [
    { name: "Dashboard", icon: LayoutDashboard, href: "/admin/dashboard" },
    { name: "Employees", icon: Users, href: "/admin/employees" },
    { name: "Assign Task", icon: ClipboardList, href: "/admin/assign-task" },
    { name: "Proof Approvals", icon: ShieldCheck, href: "#" },
    { name: "Funding Logs", icon: Banknote, href: "/admin/funding-authorizations" },
    { name: "Withdrawals", icon: Wallet, href: "/admin/withdrawals" },
    { name: "Settings", icon: Settings, href: "#" },
  ];

  const handleCreate = async () => {
    setFormError("");
    if (!formName.trim()) { setFormError("Employee name is required."); return; }
    if (!formEmail.trim()) { setFormError("Employee email is required."); return; }
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRe.test(formEmail)) { setFormError("Please enter a valid email address."); return; }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formName.trim(),
          email: formEmail.trim().toLowerCase(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setFormError(data.error || "Failed to create employee.");
        setIsSubmitting(false);
        return;
      }

      // Update state with new employee
      setEmployees(prev => [data, ...prev]);
      setCreatedEmployee(data);
      setShowCreateModal(false);
      setFormName("");
      setFormEmail("");
    } catch (err) {
      setFormError("A network error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDateString = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    } catch (e) {
      return dateString;
    }
  };

  const handleCopyCredentials = (emp: Employee) => {
    const text = `Name: ${emp.name}\nEmail: ${emp.email}\nEmployee ID: ${emp.employee_id}`;
    navigator.clipboard.writeText(text).then(() => {
      setCredentialsCopied(true);
      setTimeout(() => setCredentialsCopied(false), 2500);
    });
  };

  const filtered = employees.filter(e =>
    e.name.toLowerCase().includes(search.toLowerCase()) ||
    e.email.toLowerCase().includes(search.toLowerCase()) ||
    e.employee_id.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex h-screen bg-slate-50 font-sans overflow-hidden">

      {/* ── SIDEBAR ── */}
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

        {/* ── HEADER ── */}
        <header className="bg-white border-b border-slate-100 h-16 flex items-center justify-between px-8 shrink-0">
          <div>
            <h1 className="text-base font-semibold text-slate-800">Employee Manager</h1>
            <p className="text-xs text-slate-400">Manage all registered employees</p>
          </div>
          <div className="flex items-center space-x-3">
            <button className="relative p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
            </button>
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-bold">AD</span>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center px-3 py-1.5 text-xs font-semibold text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-slate-200 hover:border-red-200"
            >
              <LogOut className="w-3.5 h-3.5 mr-1.5" />
              Logout
            </button>
          </div>
        </header>

        {/* ── MAIN CONTENT ── */}
        <main className="flex-1 overflow-y-auto p-8 bg-slate-50">
          <div className="max-w-6xl mx-auto space-y-6">

            {/* ── SUCCESS CARD (appears after creation) ── */}
            {createdEmployee && (
              <div className="bg-white border border-emerald-200 rounded-xl shadow-sm overflow-hidden">
                <div className="h-1 w-full bg-emerald-500" />
                <div className="p-6 flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center shrink-0">
                      <BadgeCheck className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-emerald-700 mb-2">Employee Created Successfully</h3>
                      <div className="grid grid-cols-3 gap-4">
                        {[
                          { label: "Name", value: createdEmployee.name },
                          { label: "Email", value: createdEmployee.email },
                          { label: "Employee ID", value: createdEmployee.employee_id },
                        ].map(item => (
                          <div key={item.label} className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-3">
                            <p className="text-xs text-slate-400 mb-1">{item.label}</p>
                            <p className="text-sm font-bold text-slate-800 font-mono">{item.value}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 ml-6 shrink-0">
                    <button
                      onClick={() => handleCopyCredentials(createdEmployee)}
                      className={`flex items-center px-4 py-2 text-sm font-semibold rounded-lg transition-all ${credentialsCopied
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-blue-600 hover:bg-blue-700 text-white"
                        }`}
                    >
                      {credentialsCopied
                        ? <><CheckCheck className="w-4 h-4 mr-1.5" />Copied!</>
                        : <><Copy className="w-4 h-4 mr-1.5" />Copy Credentials</>
                      }
                    </button>
                    <button
                      onClick={() => setCreatedEmployee(null)}
                      className="p-2 text-slate-300 hover:text-slate-500 rounded-lg hover:bg-slate-100 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ── EMPLOYEE TABLE CARD ── */}
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
              {/* Table header bar */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                <div className="flex items-center space-x-2">
                  <Users className="w-4 h-4 text-blue-600" />
                  <h2 className="text-sm font-bold text-blue-600 uppercase tracking-wider">All Employees</h2>
                  <span className="ml-2 px-2.5 py-0.5 bg-blue-50 text-blue-600 text-xs font-semibold rounded-full">{employees.length}</span>
                </div>
                <div className="flex items-center space-x-3">
                  {/* Search */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                    <input
                      type="text"
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                      placeholder="Search employees..."
                      className="pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all w-52"
                    />
                  </div>
                  {/* Create button */}
                  <button
                    onClick={() => { setShowCreateModal(true); setFormError(""); setFormName(""); setFormEmail(""); }}
                    className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors shadow-sm shadow-blue-200"
                  >
                    <UserPlus className="w-4 h-4 mr-2" />
                    Create Employee
                  </button>
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 text-xs font-semibold text-slate-400 uppercase tracking-wider bg-slate-50/60">
                      <th className="px-6 py-3 text-left">Employee Name</th>
                      <th className="px-4 py-3 text-left">Email</th>
                      <th className="px-4 py-3 text-left">Employee ID</th>
                      <th className="px-4 py-3 text-left">Status</th>
                      <th className="px-4 py-3 text-left">Active Task</th>
                      <th className="px-4 py-3 text-left">Created Date</th>
                      <th className="px-4 py-3 text-left">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {loadingEmployees ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-12 text-center text-sm text-slate-400">
                          <Loader2 className="w-6 h-6 animate-spin mx-auto text-blue-500 mb-2" />
                          Loading employees...
                        </td>
                      </tr>
                    ) : filtered.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-12 text-center text-sm text-slate-400">
                          No employees found.
                        </td>
                      </tr>
                    ) : (
                      filtered.map((emp, i) => (
                        <tr key={emp.id || i} className="hover:bg-slate-50/80 transition-colors group">
                          <td className="px-6 py-4">
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-xs font-bold shrink-0">
                                {emp.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                              </div>
                              <span className="font-semibold text-slate-800 text-xs">{emp.name}</span>
                            </div>
                          </td>
                          <td className="px-4 py-4 text-xs text-slate-500">{emp.email}</td>
                          <td className="px-4 py-4">
                            <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2 py-1 rounded-md">{emp.employee_id}</span>
                          </td>
                          <td className="px-4 py-4">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wide ${emp.status === "Active" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-600"
                              }`}>
                              {emp.status === "Active"
                                ? <BadgeCheck className="w-3 h-3 mr-1" />
                                : <XCircle className="w-3 h-3 mr-1" />
                              }
                              {emp.status}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            <span className={`text-xs font-semibold ${emp.active_task ? "text-blue-600" : "text-slate-400"}`}>
                              {emp.active_task ? "Yes" : "No"}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-xs text-slate-500">{formatDateString(emp.created_at)}</td>
                          <td className="px-4 py-4">
                            <button
                              onClick={() => setViewEmployee(emp)}
                              className="flex items-center px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold rounded-lg transition-colors border border-blue-100"
                            >
                              <Eye className="w-3.5 h-3.5 mr-1.5" />
                              View
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Table footer */}
              <div className="px-6 py-3 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
                <p className="text-xs text-slate-400">
                  Showing <span className="font-semibold text-slate-600">{filtered.length}</span> of <span className="font-semibold text-slate-600">{employees.length}</span> employees
                </p>
              </div>
            </div>

          </div>
        </main>
      </div>

      {/* ══════════════════════════════════════════════ CREATE EMPLOYEE MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <UserPlus className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900">Create New Employee</h2>
                  <p className="text-xs text-slate-400 mt-0.5">Employee ID will be auto-generated</p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-2 text-slate-300 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal body */}
            <div className="px-6 py-6 space-y-5">
              {/* Auto-ID preview */}
              <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-0.5">Auto-Generated Employee ID</p>
                  <p className="font-mono text-base font-bold text-blue-800">EMP-XXXXX</p>
                </div>
                <div className="p-2 bg-blue-100 rounded-lg">
                  <ShieldCheck className="w-4 h-4 text-blue-600" />
                </div>
              </div>

              {/* Name field */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Employee Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={e => setFormName(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleCreate()}
                  placeholder="e.g. John Paul"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm placeholder:text-slate-400"
                />
              </div>

              {/* Email field */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Employee Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={formEmail}
                  onChange={e => setFormEmail(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleCreate()}
                  placeholder="e.g. john@company.io"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm placeholder:text-slate-400"
                />
              </div>

              {/* Error */}
              {formError && (
                <div className="flex items-center space-x-2 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
                  <XCircle className="w-4 h-4 text-red-500 shrink-0" />
                  <p className="text-xs text-red-600 font-medium">{formError}</p>
                </div>
              )}
            </div>

            {/* Modal footer */}
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-end space-x-3">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-5 py-2.5 text-sm font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={isSubmitting || !formName.trim() || !formEmail.trim()}
                className="flex items-center px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm shadow-blue-200"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <UserPlus className="w-4 h-4 mr-2" />
                )}
                {isSubmitting ? "Creating..." : "Create Employee"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════ VIEW EMPLOYEE PANEL */}
      {viewEmployee && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
            <div className="h-1 w-full bg-blue-600" />
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-sm font-bold">
                  {viewEmployee.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900">{viewEmployee.name}</h2>
                  <p className="text-xs text-slate-400">Employee Profile</p>
                </div>
              </div>
              <button
                onClick={() => setViewEmployee(null)}
                className="p-2 text-slate-300 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="px-6 py-5 space-y-3">
              {[
                { label: "Employee Name", value: viewEmployee.name },
                { label: "Email", value: viewEmployee.email },
                { label: "Employee ID", value: viewEmployee.employee_id, mono: true },
                { label: "Status", value: viewEmployee.status },
                { label: "Active Task", value: viewEmployee.active_task ? "Yes" : "No" },
                { label: "Created", value: formatDateString(viewEmployee.created_at) },
              ].map(item => (
                <div key={item.label} className="flex items-center justify-between py-2.5 border-b border-slate-50 last:border-0">
                  <span className="text-xs font-medium text-slate-400">{item.label}</span>
                  <span className={`text-xs font-bold text-slate-800 ${item.mono ? "font-mono bg-slate-100 px-2 py-0.5 rounded-md" : ""}`}>
                    {item.value}
                  </span>
                </div>
              ))}
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center space-x-3">
              <button
                onClick={() => handleCopyCredentials(viewEmployee)}
                className={`flex-1 flex items-center justify-center py-2.5 text-sm font-semibold rounded-xl transition-all ${credentialsCopied ? "bg-emerald-100 text-emerald-700" : "bg-blue-600 hover:bg-blue-700 text-white"
                  }`}
              >
                {credentialsCopied
                  ? <><CheckCheck className="w-4 h-4 mr-1.5" />Copied!</>
                  : <><Copy className="w-4 h-4 mr-1.5" />Copy Credentials</>
                }
              </button>
              <button
                onClick={() => setViewEmployee(null)}
                className="flex-1 flex items-center justify-center py-2.5 text-sm font-semibold text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
