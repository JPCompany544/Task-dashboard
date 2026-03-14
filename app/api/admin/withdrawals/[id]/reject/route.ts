import { NextResponse } from "next/server";
import { db } from "@/app/lib/db";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: withdrawalId } = await params;
    if (!withdrawalId) {
      return NextResponse.json({ error: "Withdrawal ID is required" }, { status: 400 });
    }

    let adminEmail = "admin@system.local";
    try {
      const body = await request.json();
      if (body?.admin_email) adminEmail = body.admin_email;
    } catch (e) {}

    return new Promise<NextResponse>((resolve) => {
      db.run(
        `UPDATE withdrawals
         SET status = 'rejected',
             reviewed_by = ?,
             reviewed_at = CURRENT_TIMESTAMP
         WHERE withdrawal_id = ? AND status = 'pending'`,
        [adminEmail, withdrawalId],
        function (this: any, err: any) {
          if (err) {
            console.error("DB error rejecting withdrawal:", err);
            return resolve(
              NextResponse.json({ error: "Failed to reject withdrawal" }, { status: 500 })
            );
          }
          if (this.changes === 0) {
            return resolve(
              NextResponse.json({ error: "Withdrawal not found or not pending" }, { status: 404 })
            );
          }
          resolve(NextResponse.json({ success: true, message: "Withdrawal rejected." }));
        }
      );
    });
  } catch (error) {
    console.error("Error rejecting withdrawal:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
