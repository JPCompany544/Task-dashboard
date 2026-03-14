import { NextResponse } from "next/server";
import { db } from "@/app/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const employee_id = searchParams.get("employee_id");

  if (!employee_id) {
    return NextResponse.json({ error: "employee_id is required" }, { status: 400 });
  }

  return new Promise((resolve) => {
    db.all(
      `SELECT * FROM withdrawals
       WHERE employee_id = ?
       ORDER BY created_at DESC`,
      [employee_id],
      (err, rows) => {
        if (err) {
          console.error("Error fetching withdrawals:", err);
          return resolve(
            NextResponse.json({ error: "Database error" }, { status: 500 })
          );
        }
        resolve(NextResponse.json(rows || []));
      }
    );
  });
}
