import { NextResponse } from "next/server";
import { db, initDb } from "@/app/lib/db";

// Ensure DB is initialized
initDb();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, employee_id } = body;

    if (!email || !employee_id) {
      return NextResponse.json({ error: "Email and Employee ID are required" }, { status: 400 });
    }

    return new Promise<NextResponse>((resolve) => {
      // Find employee
      db.get(
        "SELECT * FROM employees WHERE email = ? AND employee_id = ?",
        [email.toLowerCase().trim(), employee_id.trim()],
        (err: any, row: any) => {
          if (err) {
            resolve(NextResponse.json({ error: "Database error" }, { status: 500 }));
            return;
          }

          if (!row) {
            resolve(NextResponse.json({ error: "Invalid credentials or inactive account" }, { status: 401 }));
            return;
          }

          if (row.status !== "Active") {
            resolve(NextResponse.json({ error: "Your account is inactive, contact admin" }, { status: 403 }));
            return;
          }

          // Valid login, create session object
          resolve(NextResponse.json({
            user_role: "employee",
            employee_id: row.employee_id,
            name: row.name,
            email: row.email
          }, { status: 200 }));
        }
      );
    });

  } catch (error) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}
