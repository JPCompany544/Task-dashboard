import { NextRequest, NextResponse } from "next/server";
import { db } from "@/app/lib/db";

export async function PATCH(
  request: NextRequest,
  context: any
) {
  try {
    const { id: taskId } = await context.params;
    if (!taskId) {
      return NextResponse.json({ error: "Task ID is required" }, { status: 400 });
    }

    const formData = await request.formData();
    const file = formData.get("proof") as File;

    if (!file) {
      return NextResponse.json({ error: "No proof file provided" }, { status: 400 });
    }

    // Read the file data
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Convert file to base64 Data URI instead of saving to disk (Vercel is read-only)
    const mimeType = file.type || "image/png";
    const base64Data = buffer.toString("base64");
    const relativeFilePath = `data:${mimeType};base64,${base64Data}`;

    const result: any = await new Promise((resolve, reject) => {
      db.run(
        `UPDATE tasks 
         SET funding_proof_url = ?, 
             funding_status = 'pending', 
             updated_at = CURRENT_TIMESTAMP 
         WHERE task_id = ?`,
        [relativeFilePath, taskId],
        function (this: any, err: any) {
          if (err) reject(err);
          else resolve({ changes: this.changes });
        }
      );
    });

    if (result.changes === 0) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, proof_url: relativeFilePath });
  } catch (error: any) {
    console.error("FUNDING PROOF ERROR:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}
