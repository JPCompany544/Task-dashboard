// Shared auth utilities — runs client-side only (no DB)

export const ADMIN_EMAIL    = "chasebillsonly@gmail.com";
export const ADMIN_PASSWORD = "chasebills$$";

export interface EmployeeRecord {
  name: string;
  email: string;
  employee_id: string;
  status: "Active" | "Suspended";
}

// Seed employees (match Employee Manager initial data)
export const SEED_EMPLOYEES: EmployeeRecord[] = [
  { name: "John Paul",  email: "john.paul@corp.io",  employee_id: "EMP-48392", status: "Active" },
  { name: "Sarah Cole", email: "sarah.cole@corp.io", employee_id: "EMP-19284", status: "Active" },
  { name: "Alex Kim",   email: "alex.kim@corp.io",   employee_id: "EMP-73921", status: "Active" },
  { name: "David Lee",  email: "david.lee@corp.io",  employee_id: "EMP-60117", status: "Active" },
  { name: "Linda Ross", email: "linda.ross@corp.io", employee_id: "EMP-55483", status: "Suspended" },
];

/** Get all employees: seed + any saved in localStorage */
export function getAllEmployees(): EmployeeRecord[] {
  if (typeof window === "undefined") return SEED_EMPLOYEES;
  try {
    const stored = localStorage.getItem("ec_employees");
    const added: EmployeeRecord[] = stored ? JSON.parse(stored) : [];
    // Merge: stored employees take precedence over seed (by employee_id)
    const seedFiltered = SEED_EMPLOYEES.filter(
      s => !added.find(a => a.employee_id === s.employee_id)
    );
    return [...added, ...seedFiltered];
  } catch {
    return SEED_EMPLOYEES;
  }
}

/** Set the session cookie */
export function setSessionCookie(role: "employee" | "admin") {
  const maxAge = 60 * 60 * 24; // 24 hours
  document.cookie = `ec_role=${role}; path=/; max-age=${maxAge}; SameSite=Strict`;
}

/** Clear the session cookie */
export function clearSessionCookie() {
  document.cookie = "ec_role=; path=/; max-age=0; SameSite=Strict";
}
