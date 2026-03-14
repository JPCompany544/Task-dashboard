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
    const txHash = (body.tx_hash as string)?.trim() || "";
    const wallet = (body.wallet as string)?.trim() || "";
    const proofUrl = body.proof_url || null;

    if (!txHash || !wallet) {
      return NextResponse.json(
        { error: "Transaction hash and wallet address are required" },
        { status: 400 }
      );
    }

    if (!proofUrl) {
      return NextResponse.json(
        { error: "Proof URL is required" },
        { status: 400 }
      );
    }

    const task = await new Promise<any>((resolve, reject) => {
      db.get("SELECT * FROM tasks WHERE task_id = ?", [taskId], (err: any, row: any) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const result: any = await new Promise((resolve, reject) => {
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
        function (this: any, err: any) {
          if (err) reject(err);
          else resolve({ changes: this.changes });
        }
      );
    });

    if (result.changes === 0) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      proof_url: proofUrl,
      message: "Proof submitted successfully. Awaiting admin approval.",
    });

  } catch (error: any) {
    console.error("SUBMIT PROOF ERROR:", error);
    return NextResponse.json({ error: "Internal server error", details: error.message }, { status: 500 });
  }
}
