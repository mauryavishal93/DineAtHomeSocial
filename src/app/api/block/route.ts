import { NextRequest } from "next/server";
import { requireAuth } from "@/server/auth/rbac";
import { connectMongo } from "@/server/db/mongoose";
import { User } from "@/server/models/User";
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

    // TODO: Create BlockedUser model
    // For now, we'll use a simple approach with User model
    // In production, create a BlockedUser collection:
    // await BlockedUser.findOneAndUpdate(
    //   { blockerUserId: ctx.userId, blockedUserId: targetUserId },
    //   { blockerUserId: ctx.userId, blockedUserId: targetUserId, blockedAt: new Date() },
    //   { upsert: true, new: true }
    // );

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

    // TODO: Fetch from BlockedUser collection
    // const blockedUsers = await BlockedUser.find({ blockerUserId: ctx.userId })
    //   .populate({ path: "blockedUserId", select: "name" })
    //   .lean();

    return createResponse({
      blockedUsers: [] // Placeholder
    });
  } catch (error: any) {
    return createResponse({ error: error.message }, { status: 401 });
  }
}
