import { NextResponse } from "next/server";
import { db } from "@/app/lib/db";
import { writeFile, mkdir } from "fs/promises";
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
    const file = formData.get("screenshot") as File | null;
    const txHash = (formData.get("tx_hash") as string)?.trim() || "";
    const wallet = (formData.get("wallet") as string)?.trim() || "";

    if (!txHash || !wallet) {
      return NextResponse.json(
        { error: "Transaction hash and wallet address are required" },
        { status: 400 }
      );
    }

    // Check task exists and belongs to an employee
    const task = await new Promise<any>((resolve, reject) => {
      db.get("SELECT * FROM tasks WHERE task_id = ?", [taskId], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    let proofUrl: string | null = null;

    if (file && file.size > 0) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const ext = path.extname(file.name) || ".png";
      const fileName = crypto.randomBytes(16).toString("hex") + ext;
      const uploadDir = path.join(process.cwd(), "public", "uploads", "task_proofs");
      await mkdir(uploadDir, { recursive: true });
      await writeFile(path.join(uploadDir, fileName), buffer);
      proofUrl = `/uploads/task_proofs/${fileName}`;
    }

    return new Promise<NextResponse>((resolve) => {
      db.run(
        `UPDATE tasks
         SET completion_tx_hash   = ?,
             completion_wallet    = ?,
             completion_proof_url = COALESCE(?, completion_proof_url),
             proof_status         = 'pending',
             status               = 'proof_submitted',
             updated_at           = CURRENT_TIMESTAMP
         WHERE task_id = ?`,
        [txHash, wallet, proofUrl, taskId],
        function (err) {
          if (err) {
            console.error("DB error submitting proof:", err);
            return resolve(
              NextResponse.json({ error: "Database error" }, { status: 500 })
            );
          }
          if (this.changes === 0) {
            return resolve(
              NextResponse.json({ error: "Task not found" }, { status: 404 })
            );
          }
          resolve(
            NextResponse.json({
              success: true,
              proof_url: proofUrl,
              message: "Proof submitted successfully. Awaiting admin approval.",
            })
          );
        }
      );
    });
  } catch (error) {
    console.error("Error submitting proof:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
