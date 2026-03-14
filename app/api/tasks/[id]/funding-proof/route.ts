import { NextResponse } from "next/server";
import { db } from "@/app/lib/db";
import { writeFile } from "fs/promises";
import path from "path";
import crypto from "crypto";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: taskId } = await params;
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

    // Update the database
    return new Promise<NextResponse>((resolve) => {
      db.run(
        `UPDATE tasks 
         SET funding_proof_url = ?, 
             funding_status = 'pending', 
             updated_at = CURRENT_TIMESTAMP 
         WHERE task_id = ?`,
        [relativeFilePath, taskId],
        function (err) {
          if (err) {
            console.error("Database error updating funding proof:", err);
            resolve(NextResponse.json({ error: "Failed to update funding proof status" }, { status: 500 }));
            return;
          }
          if (this.changes === 0) {
            resolve(NextResponse.json({ error: "Task not found" }, { status: 404 }));
            return;
          }
          resolve(NextResponse.json({ success: true, proof_url: relativeFilePath }));
        }
      );
    });
  } catch (error) {
    console.error("Error processing funding proof upload:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
