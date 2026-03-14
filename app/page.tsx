import { redirect } from "next/navigation";

// Root "/" — middleware handles role-based routing to /login or /dashboard
// This component is only reached if middleware passes through (shouldn't happen in normal flow)
export default function Home() {
  redirect("/login");
}
