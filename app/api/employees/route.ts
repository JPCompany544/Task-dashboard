import { NextResponse } from "next/server";
import { db, initDb } from "@/app/lib/db";

initDb();

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const rows: any = await new Promise((resolve, reject) => {
      db.all("SELECT * FROM employees ORDER BY created_at DESC", [], (err: any, rows: any) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });

    const mappedRows = rows.map((row: any) => ({
      ...row,
      active_task: Boolean(row.active_task),
    }));
    return NextResponse.json(mappedRows);
  } catch (err) {
    console.error("GET EMPLOYEES ERROR:", err);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email } = body;

    if (!name || !email) {
      return NextResponse.json({ error: "Name and email are required" }, { status: 400 });
    }

    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRe.test(email)) {
      return NextResponse.json({ error: "Invalid email format" }, { status: 400 });
    }

    const existingEmail = await new Promise((resolve, reject) => {
      db.get("SELECT id FROM employees WHERE email = ?", [email.toLowerCase()], (err: any, row: any) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (existingEmail) {
      return NextResponse.json({ error: "Email already exists" }, { status: 400 });
    }

    // Function to handle insertion with ID collision check
    const insertEmployee = async (): Promise<any> => {
      const num = Math.floor(10000 + Math.random() * 90000);
      const empId = `EMP-${num}`;

      const existingId = await new Promise((resolve, reject) => {
        db.get("SELECT id FROM employees WHERE employee_id = ?", [empId], (err: any, row: any) => {
          if (err) reject(err);
          else resolve(row);
        });
      });

      if (existingId) return insertEmployee();

      return new Promise((resolve, reject) => {
        const stmt = db.prepare(`
          INSERT INTO employees (name, email, employee_id, status, active_task)
          VALUES (?, ?, ?, 'Active', FALSE)
        `);
        stmt.run([name.trim(), email.toLowerCase().trim(), empId], function (this: any, err: any) {
          if (err) reject(err);
          else resolve({ lastID: this.lastID });
        });
        stmt.finalize();
      });
    };

    const { lastID } = await insertEmployee();

    const newRow: any = await new Promise((resolve, reject) => {
      db.get("SELECT * FROM employees WHERE id = ?", [lastID], (err: any, row: any) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    return NextResponse.json({
      ...newRow,
      active_task: Boolean(newRow?.active_task),
    }, { status: 201 });

  } catch (error: any) {
    console.error("POST EMPLOYEE ERROR:", error);
    return NextResponse.json({ error: "Internal server error", details: error.message }, { status: 500 });
  }
}
