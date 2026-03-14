import { NextResponse } from "next/server";
import { db } from "@/app/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  return new Promise<NextResponse>((resolve) => {
    db.all(
      `SELECT w.*, e.name AS employee_name
       FROM withdrawals w
       JOIN employees e ON w.employee_id = e.employee_id
       WHERE w.status = 'pending'
       ORDER BY w.created_at ASC`,
      [],
      (err: any, rows: any) => {
        if (err) {
          console.error("Database error fetching pending withdrawals:", err);
          return resolve(
            NextResponse.json(
              { error: "Failed to fetch pending withdrawals" },
              { status: 500 }
            )
          );
        }
        resolve(NextResponse.json(rows || []));
      }
    );
  });
}
