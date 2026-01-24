import { ok, unauthorized, serverError, badRequest } from "@/server/http/response";
import { requireAdminAuth } from "@/server/auth/rbac";
import { connectMongo } from "@/server/db/mongoose";
import { Withdrawal } from "@/server/models/Withdrawal";
import { Wallet } from "@/server/models/Wallet";
import { WalletHistory } from "@/server/models/WalletHistory";
import { AdminAction } from "@/server/models/AdminAction";

export const runtime = "nodejs";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ withdrawalId: string; action: string }> }
) {
  try {
    const ctx = await requireAdminAuth(req as unknown as { headers: Headers });
    const { withdrawalId, action } = await params;

    if (!["approve", "reject", "mark-paid"].includes(action)) {
      return badRequest("Invalid action");
    }

    await connectMongo();

    const withdrawal = await Withdrawal.findById(withdrawalId);
    if (!withdrawal) {
      return badRequest("Withdrawal not found");
    }

    const withdrawalDoc = withdrawal as any;

    if (action === "approve") {
      if (withdrawalDoc.status !== "PENDING") {
        return badRequest("Withdrawal is not pending");
      }

      withdrawalDoc.status = "APPROVED";
      withdrawalDoc.approvedAt = new Date();
      withdrawalDoc.approvedBy = ctx.adminId;
      await withdrawalDoc.save();

      // Move from balance to pendingBalance
      const wallet = await Wallet.findOne({ userId: withdrawalDoc.userId });
      if (wallet) {
        const walletDoc = wallet as any;
        if (walletDoc.balance >= withdrawalDoc.amount) {
          walletDoc.balance -= withdrawalDoc.amount;
          walletDoc.pendingBalance += withdrawalDoc.amount;
          await walletDoc.save();

          // Create wallet history entry
          await WalletHistory.create({
            walletId: walletDoc._id,
            userId: withdrawalDoc.userId,
            transactionType: "WITHDRAWAL_APPROVED",
            amount: -withdrawalDoc.amount,
            balanceBefore: walletDoc.balance + withdrawalDoc.amount,
            balanceAfter: walletDoc.balance,
            description: `Withdrawal approved by admin`,
            referenceId: String(withdrawalDoc._id),
            referenceType: "WITHDRAWAL",
            adminId: ctx.adminId
          });
        }
      }

      // Log admin action
      await AdminAction.create({
        adminUserId: ctx.adminId,
        adminUsername: ctx.username,
        actionType: "APPROVE_WITHDRAWAL",
        targetType: "WITHDRAWAL",
        targetId: withdrawalDoc._id,
        targetUserId: withdrawalDoc.userId,
        description: `Approved withdrawal of ${withdrawalDoc.amount / 100} INR`
      });
    } else if (action === "reject") {
      const body = await req.json();
      const reason = body.reason || "No reason provided";

      if (withdrawalDoc.status !== "PENDING") {
        return badRequest("Withdrawal is not pending");
      }

      withdrawalDoc.status = "REJECTED";
      withdrawalDoc.rejectedAt = new Date();
      withdrawalDoc.rejectedBy = ctx.adminId;
      withdrawalDoc.rejectionReason = reason;
      await withdrawalDoc.save();

      // Log admin action
      await AdminAction.create({
        adminUserId: ctx.adminId,
        adminUsername: ctx.username,
        actionType: "REJECT_WITHDRAWAL",
        targetType: "WITHDRAWAL",
        targetId: withdrawalDoc._id,
        targetUserId: withdrawalDoc.userId,
        description: `Rejected withdrawal: ${reason}`
      });
    } else if (action === "mark-paid") {
      const body = await req.json();
      const paymentRef = body.reason || body.paymentReference || "";

      if (withdrawalDoc.status !== "APPROVED") {
        return badRequest("Withdrawal must be approved first");
      }

      withdrawalDoc.status = "PAID";
      withdrawalDoc.paidAt = new Date();
      withdrawalDoc.paidBy = ctx.adminId;
      withdrawalDoc.paymentReference = paymentRef;
      await withdrawalDoc.save();

      // Update wallet
      const wallet = await Wallet.findOne({ userId: withdrawalDoc.userId });
      if (wallet) {
        const walletDoc = wallet as any;
        walletDoc.pendingBalance -= withdrawalDoc.amount;
        walletDoc.totalWithdrawn += withdrawalDoc.amount;
        await walletDoc.save();

        // Create wallet history entry
        await WalletHistory.create({
          walletId: walletDoc._id,
          userId: withdrawalDoc.userId,
          transactionType: "WITHDRAWAL_PAID",
          amount: -withdrawalDoc.amount,
          balanceBefore: walletDoc.pendingBalance + withdrawalDoc.amount,
          balanceAfter: walletDoc.pendingBalance,
          description: `Withdrawal paid - Reference: ${paymentRef}`,
          referenceId: String(withdrawalDoc._id),
          referenceType: "WITHDRAWAL",
          adminId: ctx.adminId,
          metadata: { paymentReference: paymentRef }
        });
      }

      // Log admin action
      await AdminAction.create({
        adminUserId: ctx.adminId,
        adminUsername: ctx.username,
        actionType: "MARK_WITHDRAWAL_PAID",
        targetType: "WITHDRAWAL",
        targetId: withdrawalDoc._id,
        targetUserId: withdrawalDoc.userId,
        description: `Marked withdrawal as paid - Reference: ${paymentRef}`
      });
    }

    return ok({ success: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    console.error("Admin withdrawal action error:", msg);
    if (msg.toLowerCase().includes("unauthorized") || msg.toLowerCase().includes("invalid token")) {
      return unauthorized("Invalid or missing authentication token");
    }
    return serverError(`Failed to process withdrawal: ${msg}`);
  }
}
