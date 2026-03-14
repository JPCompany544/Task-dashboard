import { NextResponse } from "next/server";
import { db, initDb } from "@/app/lib/db";

initDb();

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const employee_id = searchParams.get("employee_id");

  try {
    const rows: any = await new Promise((resolve, reject) => {
      const query = employee_id 
        ? "SELECT * FROM tasks WHERE employee_id = ? ORDER BY created_at DESC"
        : "SELECT * FROM tasks ORDER BY created_at DESC";
      const params = employee_id ? [employee_id] : [];

      db.all(query, params, (err: any, rows: any) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });

    const mappedRows = rows.map((row: any) => ({
      ...row,
      funding_confirmed: Boolean(row.funding_confirmed),
    }));
    return NextResponse.json(mappedRows);
  } catch (err) {
    console.error("GET TASKS ERROR:", err);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { employee_id, token, purchase_amount, exchange, commission, funding_method, deadline } = body;

    if (!employee_id || !token || !purchase_amount || !exchange || commission === undefined || !deadline) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // First, check if the employee already has an active task
    const existingTask = await new Promise((resolve, reject) => {
      db.get(
        "SELECT task_id FROM tasks WHERE employee_id = ? AND status IN ('Pending', 'Started', 'In Progress', 'Proof Submitted', 'Awaiting Approval')",
        [employee_id],
        (err: any, row: any) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });

    if (existingTask) {
      return NextResponse.json({ error: "This employee already has an active task." }, { status: 400 });
    }

    // No active task, proceed to create
    const task_id = `TASK-${Math.floor(100000 + Math.random() * 900000)}`;

    await new Promise((resolve, reject) => {
      const stmt = db.prepare(`
        INSERT INTO tasks (
          task_id, employee_id, token, purchase_amount, exchange, 
          commission, deadline, status, funding_method, funding_confirmed, funding_status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 'Pending', ?, FALSE, 'none')
      `);

      stmt.run(
        [task_id, employee_id, token, Number(purchase_amount), exchange, Number(commission), deadline, funding_method || null],
        function (err2: any) {
          if (err2) reject(err2);
          else resolve(true);
        }
      );
      stmt.finalize();
    });

    // Also update the employee to reflect an active task
    await new Promise((resolve, reject) => {
      // Postgres uses TRUE for boolean columns
      db.run("UPDATE employees SET active_task = TRUE WHERE employee_id = ?", [employee_id], (err: any) => {
        if (err) reject(err);
        else resolve(true);
      });
    });

    const newTask: any = await new Promise((resolve, reject) => {
      db.get("SELECT * FROM tasks WHERE task_id = ?", [task_id], (err3: any, newRow: any) => {
        if (err3) reject(err3);
        else resolve(newRow);
      });
    });

    return NextResponse.json({
      ...newTask,
      funding_confirmed: Boolean(newTask?.funding_confirmed)
    }, { status: 201 });

  } catch (error: any) {
    console.error("POST TASK ERROR:", error);
    return NextResponse.json({ error: "Internal server error", details: error.message }, { status: 500 });
  }
}
