import { NextResponse } from "next/server";
import { db } from "@/app/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const employee_id = searchParams.get("employee_id");

  if (!employee_id) {
    return NextResponse.json({ error: "employee_id is required" }, { status: 400 });
  }

  return new Promise<NextResponse>((resolve) => {
    db.get(
      `SELECT
         (SELECT COALESCE(SUM(commission), 0) FROM tasks WHERE employee_id = ? AND proof_status = 'approved') AS total_earnings,
         (SELECT COUNT(*) FROM tasks WHERE employee_id = ? AND proof_status = 'approved') AS tasks_completed,
         (SELECT COALESCE(SUM(amount), 0) FROM withdrawals WHERE employee_id = ? AND status = 'approved') AS total_withdrawn
      `,
      [employee_id, employee_id, employee_id],
      (err: any, row: any) => {
        if (err) {
          console.error("Error fetching employee stats:", err);
          return resolve(
            NextResponse.json({ error: "Database error" }, { status: 500 })
          );
        }

        const total_earnings = Number(row?.total_earnings ?? 0);
        const tasks_completed = Number(row?.tasks_completed ?? 0);
        const total_withdrawn = Number(row?.total_withdrawn ?? 0);
        const available_balance = total_earnings - total_withdrawn;

        resolve(
          NextResponse.json({
            available_balance: available_balance > 0 ? available_balance : 0,
            total_earnings,
            tasks_completed,
          })
        );
      }
    );
  });
}
