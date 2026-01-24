import { ok, unauthorized, serverError, badRequest } from "@/server/http/response";
import { requireAdminAuth } from "@/server/auth/rbac";
import { connectMongo } from "@/server/db/mongoose";
import { Dispute } from "@/server/models/Dispute";
import { Booking } from "@/server/models/Booking";
import { Payment } from "@/server/models/Payment";
import { Wallet } from "@/server/models/Wallet";
import { WalletHistory } from "@/server/models/WalletHistory";
import { AdminAction } from "@/server/models/AdminAction";
import { Notification } from "@/server/models/Notification";

export const runtime = "nodejs";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ disputeId: string }> }
) {
  try {
    const ctx = await requireAdminAuth(req as unknown as { headers: Headers });
    const { disputeId } = await params;
    const body = await req.json();
    const { action, refund, notes } = body;

    if (!["resolve", "escalate", "close"].includes(action)) {
      return badRequest("Invalid action");
    }

    await connectMongo();

    const dispute = await Dispute.findById(disputeId);
    if (!dispute) {
      return badRequest("Dispute not found");
    }

    const disputeDoc = dispute as any;

    if (action === "resolve") {
      if (!notes) {
        return badRequest("Resolution notes are required");
      }

      disputeDoc.status = "RESOLVED";
      disputeDoc.resolvedRefund = refund || 0;
      disputeDoc.resolution = notes;
      disputeDoc.resolvedBy = ctx.adminId;
      disputeDoc.resolvedAt = new Date();
      await disputeDoc.save();

      // Process refund if applicable
      if (refund > 0) {
        const booking = await Booking.findById(disputeDoc.bookingId);
        if (booking) {
          const bookingDoc = booking as any;
          
          // Credit refund to guest wallet
          let wallet = await Wallet.findOne({ userId: disputeDoc.guestUserId });
          if (!wallet) {
            wallet = await Wallet.create({
              userId: disputeDoc.guestUserId,
              role: "GUEST",
              balance: 0,
              pendingBalance: 0,
              totalEarned: 0,
              totalWithdrawn: 0
            });
          }
          const walletDoc = wallet as any;
          const balanceBefore = walletDoc.balance;
          walletDoc.balance += refund;
          await walletDoc.save();

          // Create wallet history
          await WalletHistory.create({
            walletId: walletDoc._id,
            userId: disputeDoc.guestUserId,
            transactionType: "REFUND_CREDIT",
            amount: refund,
            balanceBefore,
            balanceAfter: walletDoc.balance,
            description: `Refund from dispute resolution: ${disputeDoc.title}`,
            referenceId: String(disputeDoc._id),
            referenceType: "DISPUTE",
            adminId: ctx.adminId,
            metadata: { bookingId: String(disputeDoc.bookingId) }
          });

          // Update booking status if needed
          if (bookingDoc.status === "CONFIRMED") {
            bookingDoc.status = "CANCELLED";
            await bookingDoc.save();
          }
        }
      }

      // Create notifications
      await Notification.create({
        userId: disputeDoc.guestUserId,
        type: "BOOKING_CANCELLED",
        title: "Dispute Resolved",
        message: `Your dispute has been resolved. ${refund > 0 ? `Refund of ₹${refund / 100} has been credited to your wallet.` : ""}`,
        relatedBookingId: disputeDoc.bookingId,
        metadata: { disputeId: String(disputeDoc._id), refund }
      });

      await Notification.create({
        userId: disputeDoc.hostUserId,
        type: "EVENT_CANCELLED",
        title: "Dispute Resolved",
        message: `A dispute for your event has been resolved by admin.`,
        relatedBookingId: disputeDoc.bookingId,
        metadata: { disputeId: String(disputeDoc._id) }
      });
    } else if (action === "escalate") {
      disputeDoc.status = "ESCALATED";
      disputeDoc.priority = "URGENT";
      await disputeDoc.save();
    } else if (action === "close") {
      disputeDoc.status = "CLOSED";
      await disputeDoc.save();
    }

    // Log admin action
    await AdminAction.create({
      adminUserId: ctx.adminId,
      adminUsername: ctx.username,
      actionType: `${action.toUpperCase()}_DISPUTE`,
      targetType: "DISPUTE",
      targetId: disputeDoc._id,
      targetUserId: disputeDoc.guestUserId,
      description: `${action === "resolve" ? `Resolved dispute with refund of ₹${(refund || 0) / 100}` : `Dispute ${action}d`}: ${notes || ""}`
    });

    return ok({ success: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    console.error("Admin dispute resolve error:", msg);
    if (msg.toLowerCase().includes("unauthorized") || msg.toLowerCase().includes("invalid token")) {
      return unauthorized("Invalid or missing authentication token");
    }
    return serverError(`Failed to process dispute: ${msg}`);
  }
}
