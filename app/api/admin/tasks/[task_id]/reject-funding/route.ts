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

    return new Promise<NextResponse>((resolve) => {
      db.run(
        `UPDATE tasks 
         SET funding_status = 'rejected', 
             updated_at = CURRENT_TIMESTAMP 
         WHERE task_id = ?`,
        [taskId],
        function (err) {
          if (err) {
            console.error("Database error rejecting funding:", err);
            return resolve(NextResponse.json({ error: "Failed to reject funding" }, { status: 500 }));
          }
          if (this.changes === 0) {
            return resolve(NextResponse.json({ error: "Task not found" }, { status: 404 }));
          }
          resolve(NextResponse.json({ success: true, message: "Funding rejected successfully" }));
        }
      );
    });
  } catch (error) {
    console.error("Error rejecting funding:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
