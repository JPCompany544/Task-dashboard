import { NextResponse } from "next/server";
import { db, initDb } from "@/app/lib/db";

// Ensure DB is initialized
initDb();

export const dynamic = 'force-dynamic';

export async function GET() {
  return new Promise<NextResponse>((resolve) => {
    db.all("SELECT * FROM employees ORDER BY created_at DESC", [], (err: any, rows: any) => {
      if (err) {
        resolve(NextResponse.json({ error: "Database error" }, { status: 500 }));
      } else {
        // Map over rows to correctly return active_task as a boolean to the frontend to maintain compatibility
        const mappedRows = rows.map((row: any) => ({
          ...row,
          active_task: Boolean(row.active_task),
        }));
        resolve(NextResponse.json(mappedRows));
      }
    });
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email } = body;

    if (!name || !email) {
      return NextResponse.json({ error: "Name and email are required" }, { status: 400 });
    }

    // Basic email validation
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRe.test(email)) {
      return NextResponse.json({ error: "Invalid email format" }, { status: 400 });
    }

    return new Promise<NextResponse>((resolve) => {
      // Check if email exists
      db.get("SELECT email FROM employees WHERE email = ?", [email.toLowerCase()], (err: any, row: any) => {
        if (err) {
          resolve(NextResponse.json({ error: "Database error" }, { status: 500 }));
          return;
        }
        if (row) {
          resolve(NextResponse.json({ error: "Email already exists" }, { status: 400 }));
          return;
        }

        // Generate unique Employee ID
        const generateAndInsert = () => {
          const num = Math.floor(10000 + Math.random() * 90000);
          const empId = `EMP-${num}`;

          db.get("SELECT employee_id FROM employees WHERE employee_id = ?", [empId], (err: any, row: any) => {
            if (err) {
              resolve(NextResponse.json({ error: "Database error" }, { status: 500 }));
              return;
            }
            if (row) {
              // Collision, try again
              generateAndInsert();
            } else {
              // Insert new employee
              const stmt = db.prepare(`
                INSERT INTO employees (name, email, employee_id, status, active_task)
                VALUES (?, ?, ?, 'Active', 0)
              `);

              stmt.run([name.trim(), email.toLowerCase().trim(), empId], function (this: any, err: any) {
                if (err) {
                  resolve(NextResponse.json({ error: "Database error" }, { status: 500 }));
                } else {
                  // Fetch the newly created record
                  db.get("SELECT * FROM employees WHERE id = ?", [this.lastID], (err: any, newRow: any) => {
                    resolve(NextResponse.json({
                      ...newRow,
                      active_task: Boolean(newRow.active_task),
                    }, { status: 201 }));
                  });
                }
              });
              stmt.finalize();
            }
          });
        };

        generateAndInsert();
      });
    });

  } catch (error) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}
