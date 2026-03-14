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

    const result: any = await new Promise((resolve, reject) => {
      db.run(
        `UPDATE tasks 
         SET funding_status = 'rejected', 
             updated_at = CURRENT_TIMESTAMP 
         WHERE task_id = ?`,
        [taskId],
        function (this: any, err: any) {
          if (err) reject(err);
          else resolve({ changes: this.changes });
        }
      );
    });

    if (result.changes === 0) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Funding rejected successfully" });
  } catch (error: any) {
    console.error("REJECT FUNDING ERROR:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}
