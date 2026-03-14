import { NextRequest, NextResponse } from "next/server";
import { db } from "@/app/lib/db";

export async function PATCH(
  request: NextRequest,
  context: any
) {
  try {
    const { task_id: taskId } = await context.params;
    if (!taskId) {
      return NextResponse.json({ error: "Task ID is required" }, { status: 400 });
    }

    let adminEmail = "admin@system.local";
    try {
      const body = await request.json();
      if (body?.admin_email) adminEmail = body.admin_email;
    } catch (e) { /* no body is fine */ }

    const result: any = await new Promise((resolve, reject) => {
      db.run(
        `UPDATE tasks
         SET proof_status      = 'rejected',
             status            = 'in_progress',
             proof_reviewed_by = ?,
             proof_reviewed_at = CURRENT_TIMESTAMP,
             updated_at        = CURRENT_TIMESTAMP
         WHERE task_id = ?`,
        [adminEmail, taskId],
        function (this: any, err: any) {
          if (err) reject(err);
          else resolve({ changes: this.changes });
        }
      );
    });

    if (result.changes === 0) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Proof rejected. Employee may resubmit." });
  } catch (error: any) {
    console.error("REJECT PROOF ERROR:", error);
    return NextResponse.json({ error: "Internal server error", details: error.message }, { status: 500 });
  }
}
