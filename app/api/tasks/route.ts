import { NextResponse } from "next/server";
import { db, initDb } from "@/app/lib/db";

initDb();

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const employee_id = searchParams.get("employee_id");

  return new Promise((resolve) => {
    const query = employee_id 
      ? "SELECT * FROM tasks WHERE employee_id = ? ORDER BY created_at DESC"
      : "SELECT * FROM tasks ORDER BY created_at DESC";
    const params = employee_id ? [employee_id] : [];

    db.all(query, params, (err, rows) => {
      if (err) {
        resolve(NextResponse.json({ error: "Database error" }, { status: 500 }));
      } else {
        const mappedRows = rows.map((row: any) => ({
          ...row,
          funding_confirmed: Boolean(row.funding_confirmed),
        }));
        resolve(NextResponse.json(mappedRows));
      }
    });
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { employee_id, token, purchase_amount, exchange, commission, funding_method, deadline } = body;

    if (!employee_id || !token || !purchase_amount || !exchange || commission === undefined || !deadline) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    return new Promise((resolve) => {
      // First, check if the employee already has an active task
      db.get(
        "SELECT task_id FROM tasks WHERE employee_id = ? AND status IN ('Pending', 'Started', 'In Progress', 'Proof Submitted', 'Awaiting Approval')",
        [employee_id],
        (err, row) => {
          if (err) {
            return resolve(NextResponse.json({ error: "Database error" }, { status: 500 }));
          }
          if (row) {
            return resolve(NextResponse.json({ error: "This employee already has an active task." }, { status: 400 }));
          }

          // No active task, proceed to create
          const task_id = `TASK-${Math.floor(100000 + Math.random() * 900000)}`;

          const stmt = db.prepare(`
            INSERT INTO tasks (
              task_id, employee_id, token, purchase_amount, exchange, 
              commission, deadline, status, funding_method, funding_confirmed, funding_status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, 'Pending', ?, 0, 'none')
          `);

          stmt.run(
            [task_id, employee_id, token, Number(purchase_amount), exchange, Number(commission), deadline, funding_method || null],
            function (err2: any) {
              if (err2) {
                return resolve(NextResponse.json({ error: "Failed to create task", details: err2.message }, { status: 500 }));
              }
              
              // Also update the employee to reflect an active task
              db.run("UPDATE employees SET active_task = 1 WHERE employee_id = ?", [employee_id], () => {
                db.get("SELECT * FROM tasks WHERE task_id = ?", [task_id], (err3, newRow: any) => {
                  resolve(NextResponse.json({
                    ...newRow,
                    funding_confirmed: Boolean(newRow?.funding_confirmed)
                  }, { status: 201 }));
                });
              });
            }
          );
          stmt.finalize();
        }
      );
    });
  } catch (error) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
