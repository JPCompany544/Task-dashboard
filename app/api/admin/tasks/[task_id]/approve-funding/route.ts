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

    // Attempting to read JSON body safely, though not strictly required if we use a default
    let adminEmail = "admin@system.local";
    try {
      const body = await request.json();
      if (body.admin_email) adminEmail = body.admin_email;
    } catch (e) {
      // ignore JSON parse error
    }

    return new Promise((resolve) => {
      db.run(
        `UPDATE tasks 
         SET funding_status = 'approved', 
             funding_reviewed_by = ?, 
             funding_reviewed_at = CURRENT_TIMESTAMP,
             updated_at = CURRENT_TIMESTAMP 
         WHERE task_id = ?`,
        [adminEmail, taskId],
        function (err) {
          if (err) {
            console.error("Database error approving funding:", err);
            return resolve(NextResponse.json({ error: "Failed to approve funding" }, { status: 500 }));
          }
          if (this.changes === 0) {
            return resolve(NextResponse.json({ error: "Task not found" }, { status: 404 }));
          }
          resolve(NextResponse.json({ success: true, message: "Funding approved successfully" }));
        }
      );
    });
  } catch (error) {
    console.error("Error approving funding:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
