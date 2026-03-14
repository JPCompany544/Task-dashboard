import { NextResponse } from "next/server";
import { db } from "@/app/lib/db";
import crypto from "crypto";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { employee_id, token, wallet_address, amount } = body;

    if (!employee_id || !token || !wallet_address || !amount) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return NextResponse.json(
        { error: "Amount must be a positive number" },
        { status: 400 }
      );
    }

    // Calculate available balance
    const availableBalance = await new Promise<number>((resolve, reject) => {
      db.get(
        `SELECT
           (SELECT COALESCE(SUM(commission), 0) FROM tasks WHERE employee_id = ? AND proof_status = 'approved') AS total_earnings,
           (SELECT COALESCE(SUM(amount), 0) FROM withdrawals WHERE employee_id = ? AND status = 'approved') AS total_withdrawn
        `,
        [employee_id, employee_id],
        (err, row: any) => {
          if (err) reject(err);
          else {
            const earnings = Number(row?.total_earnings ?? 0);
            const withdrawn = Number(row?.total_withdrawn ?? 0);
            resolve(Math.max(0, earnings - withdrawn));
          }
        }
      );
    });

    if (numAmount > availableBalance) {
      return NextResponse.json(
        { error: "Withdrawal amount exceeds available balance." },
        { status: 400 }
      );
    }

    // Insert withdrawal request
    const withdrawalId = "WD-" + crypto.randomBytes(4).toString("hex").toUpperCase();

    return new Promise<NextResponse>((resolve) => {
      db.run(
        `INSERT INTO withdrawals (withdrawal_id, employee_id, token, wallet_address, amount, status)
         VALUES (?, ?, ?, ?, ?, 'pending')`,
        [withdrawalId, employee_id, token, wallet_address, numAmount],
        function (err) {
          if (err) {
            console.error("DB error inserting withdrawal:", err);
            return resolve(
              NextResponse.json({ error: "Failed to submit withdrawal request" }, { status: 500 })
            );
          }
          resolve(
            NextResponse.json({
              success: true,
              withdrawal_id: withdrawalId,
              message: "Withdrawal request submitted successfully.",
            })
          );
        }
      );
    });
  } catch (error) {
    console.error("Error creating withdrawal request:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
