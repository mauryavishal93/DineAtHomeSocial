import { NextRequest } from "next/server";
import { requireAuth } from "@/server/auth/rbac";
import { connectMongo } from "@/server/db/mongoose";
import { User } from "@/server/models/User";
import { BlockedUser } from "@/server/models/BlockedUser";
import { createResponse } from "@/server/http/response";

// Block or unblock a user
export async function POST(req: NextRequest) {
  try {
    const ctx = await requireAuth(req);
    await connectMongo();

    const body = await req.json();
    const { targetUserId, action } = body; // action: "BLOCK" or "UNBLOCK"

    if (!targetUserId || !action) {
      return createResponse({ error: "targetUserId and action are required" }, { status: 400 });
    }

    if (String(targetUserId) === String(ctx.userId)) {
      return createResponse({ error: "Cannot block yourself" }, { status: 400 });
    }

    // Validate target exists
    const target = await User.findById(targetUserId).select("_id").lean();
    if (!target) {
      return createResponse({ error: "Target user not found" }, { status: 404 });
    }

    if (action === "BLOCK") {
      await BlockedUser.findOneAndUpdate(
        { blockerUserId: ctx.userId, blockedUserId: targetUserId },
        { $set: { blockerUserId: ctx.userId, blockedUserId: targetUserId, blockedAt: new Date() } },
        { upsert: true, new: true }
      );
    } else if (action === "UNBLOCK") {
      await BlockedUser.deleteOne({ blockerUserId: ctx.userId, blockedUserId: targetUserId });
    } else {
      return createResponse({ error: "Invalid action. Use BLOCK or UNBLOCK" }, { status: 400 });
    }

    console.log("User block action:", {
      blockerUserId: ctx.userId,
      blockedUserId: targetUserId,
      action,
      timestamp: new Date()
    });

    return createResponse({
      success: true,
      message: action === "BLOCK" 
        ? "User blocked successfully. You won't see their events or messages."
        : "User unblocked successfully."
    });
  } catch (error: any) {
    return createResponse({ error: error.message }, { status: 401 });
  }
}

// Get blocked users list
export async function GET(req: NextRequest) {
  try {
    const ctx = await requireAuth(req);
    await connectMongo();

    const blocked = await BlockedUser.find({ blockerUserId: ctx.userId })
      .sort({ blockedAt: -1 })
      .populate({ path: "blockedUserId", select: "email role status" })
      .lean();

    return createResponse({
      blockedUsers: blocked.map((b: any) => ({
        id: String(b._id),
        blockedUserId: String(b.blockedUserId?._id || b.blockedUserId),
        blockedAt: b.blockedAt,
        blockedUser: b.blockedUserId
          ? {
              email: b.blockedUserId.email,
              role: b.blockedUserId.role,
              status: b.blockedUserId.status
            }
          : null
      }))
    });
  } catch (error: any) {
    return createResponse({ error: error.message }, { status: 401 });
  }
}
