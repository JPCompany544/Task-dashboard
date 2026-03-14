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
      if (body.admin_email) adminEmail = body.admin_email;
    } catch (e) {
      // ignore JSON parse error
    }

    const result: any = await new Promise((resolve, reject) => {
      db.run(
        `UPDATE tasks 
         SET funding_status = 'approved', 
             funding_reviewed_by = ?, 
             funding_reviewed_at = CURRENT_TIMESTAMP,
             updated_at = CURRENT_TIMESTAMP 
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

    return NextResponse.json({ success: true, message: "Funding approved successfully" });
  } catch (error: any) {
    console.error("APPROVE FUNDING ERROR:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}
