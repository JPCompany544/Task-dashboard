import { NextRequest, NextResponse } from "next/server";
import { db, initDb } from "@/app/lib/db";

export async function PATCH(
  request: NextRequest,
  context: any
) {
  try {
    await initDb();
    const { id: taskId } = await context.params;
    if (!taskId) {
      return NextResponse.json({ error: "Task ID is required" }, { status: 400 });
    }

    const body = await request.json();
    const proofUrl = body.proof_url;

    if (!proofUrl) {
      return NextResponse.json({ error: "No proof URL provided" }, { status: 400 });
    }

    const result: any = await new Promise((resolve, reject) => {
      db.run(
        `UPDATE tasks 
         SET funding_proof_url = ?, 
             funding_status = 'pending', 
             updated_at = CURRENT_TIMESTAMP 
         WHERE task_id = ?`,
        [proofUrl, taskId],
        function (this: any, err: any) {
          if (err) reject(err);
          else resolve({ changes: this.changes });
        }
      );
    });

    if (result.changes === 0) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, proof_url: proofUrl });
  } catch (error: any) {
    console.error("FUNDING PROOF ERROR:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}
