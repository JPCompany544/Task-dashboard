import { NextResponse } from "next/server";
import { db, initDb } from "@/app/lib/db";

initDb();

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: taskId } = await params;
    const body = await request.json();

    const allowedUpdates = [
      "status",
      "funding_confirmed",
      "proof_tx_hash",
      "proof_wallet",
      "proof_screenshot"
    ];

    const updates: string[] = [];
    const values: any[] = [];

    // Map object properties mapping cleanly into query builder array
    Object.keys(body).forEach((key) => {
      if (allowedUpdates.includes(key)) {
        updates.push(`${key} = ?`);
        
        // Ensure accurate boolean resolution for SQLite integer cast
        if (key === "funding_confirmed") {
          values.push(body[key] ? 1 : 0);
        } else {
          values.push(body[key]);
        }
      }
    });

    if (updates.length === 0) {
      return NextResponse.json({ error: "No valid fields provided for update" }, { status: 400 });
    }

    values.push(new Date().toISOString()); // set updated_at
    updates.push(`updated_at = ?`);

    values.push(taskId); // Push end target map query param

    return new Promise((resolve) => {
      const stmt = db.prepare(`UPDATE tasks SET ${updates.join(", ")} WHERE task_id = ?`);
      stmt.run(values, function (err) {
        if (err) {
          resolve(NextResponse.json({ error: "Database error" }, { status: 500 }));
        } else {
          db.get("SELECT * FROM tasks WHERE task_id = ?", [taskId], (selectErr, row: any) => {
            resolve(NextResponse.json({
              ...row,
              funding_confirmed: Boolean(row?.funding_confirmed)
            }, { status: 200 }));
          });
        }
      });
      stmt.finalize();
    });

  } catch (error) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
