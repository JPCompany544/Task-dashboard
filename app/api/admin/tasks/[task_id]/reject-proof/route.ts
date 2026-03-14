import { NextResponse } from "next/server";
import { db } from "@/app/lib/db";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ task_id: string }> }
) {
  try {
    const { task_id: taskId } = await params;
    if (!taskId) {
      return NextResponse.json({ error: "Task ID is required" }, { status: 400 });
    }

    let adminEmail = "admin@system.local";
    try {
      const body = await request.json();
      if (body?.admin_email) adminEmail = body.admin_email;
    } catch (e) { /* no body is fine */ }

    return new Promise((resolve) => {
      db.run(
        `UPDATE tasks
         SET proof_status      = 'rejected',
             status            = 'in_progress',
             proof_reviewed_by = ?,
             proof_reviewed_at = CURRENT_TIMESTAMP,
             updated_at        = CURRENT_TIMESTAMP
         WHERE task_id = ?`,
        [adminEmail, taskId],
        function (err) {
          if (err) {
            console.error("DB error rejecting proof:", err);
            return resolve(
              NextResponse.json({ error: "Failed to reject proof" }, { status: 500 })
            );
          }
          if (this.changes === 0) {
            return resolve(
              NextResponse.json({ error: "Task not found" }, { status: 404 })
            );
          }
          resolve(
            NextResponse.json({ success: true, message: "Proof rejected. Employee may resubmit." })
          );
        }
      );
    });
  } catch (error) {
    console.error("Error rejecting proof:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
