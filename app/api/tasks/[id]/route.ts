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
        
        // Ensure accurate boolean resolution
        if (key === "funding_confirmed") {
          values.push(!!body[key]);
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

    await new Promise((resolve, reject) => {
      const stmt = db.prepare(`UPDATE tasks SET ${updates.join(", ")} WHERE task_id = ?`);
      stmt.run(values, function (this: any, err: any) {
        if (err) reject(err);
        else resolve(this.changes);
      });
      stmt.finalize();
    });

    const updatedRow: any = await new Promise((resolve, reject) => {
      db.get("SELECT * FROM tasks WHERE task_id = ?", [taskId], (err: any, row: any) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (!updatedRow) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    return NextResponse.json({
      ...updatedRow,
      funding_confirmed: Boolean(updatedRow.funding_confirmed)
    }, { status: 200 });

  } catch (error: any) {
    console.error("PATCH TASK ERROR:", error);
    return NextResponse.json({ error: "Internal server error", details: error.message }, { status: 500 });
  }
}
