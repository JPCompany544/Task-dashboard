import { redirect } from "next/navigation";

// /admin → redirect to /admin/dashboard (middleware protects this route)
export default function AdminRoot() {
  redirect("/admin/dashboard");
}
