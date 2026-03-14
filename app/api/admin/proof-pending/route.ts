import { NextResponse } from "next/server";
import { db } from "@/app/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  return new Promise<NextResponse>((resolve) => {
    db.all(
      `SELECT t.*, e.name AS employee_name
       FROM tasks t
       JOIN employees e ON t.employee_id = e.employee_id
       WHERE t.proof_status = 'pending'
       ORDER BY t.updated_at DESC`,
      [],
      (err: any, rows: any) => {
        if (err) {
          console.error("Database error fetching pending proofs:", err);
          return resolve(
            NextResponse.json(
              { error: "Failed to fetch pending proofs" },
              { status: 500 }
            )
          );
        }
        resolve(NextResponse.json(rows || []));
      }
    );
  });
}
