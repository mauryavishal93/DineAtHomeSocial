import { NextRequest } from "next/server";
import { requireAuth } from "@/server/auth/rbac";
import { connectMongo } from "@/server/db/mongoose";
import { Referral } from "@/server/models/Referral";
import { User } from "@/server/models/User";
import { HostProfile } from "@/server/models/HostProfile";
import { GuestProfile } from "@/server/models/GuestProfile";
import { createResponse } from "@/server/http/response";

// Get user's referral code and stats
export async function GET(req: NextRequest) {
  try {
    const ctx = await requireAuth(req);
    await connectMongo();

    const user = await User.findById(ctx.userId).lean();
    if (!user) {
      return createResponse({ error: "User not found" }, { status: 404 });
    }

    const userDoc = user as any;
    let referralCode = "";
    let referralStats = {
      totalReferrals: 0,
      completedReferrals: 0,
      totalRewardsEarned: 0,
      pendingRewards: 0
    };

    // Get referral code from profile
    if (ctx.role === "HOST") {
      const hostProfile = await HostProfile.findOne({ userId: ctx.userId }).lean();
      referralCode = (hostProfile as any)?.referralCode || "";
    } else {
      const guestProfile = await GuestProfile.findOne({ userId: ctx.userId }).lean();
      referralCode = (guestProfile as any)?.referralCode || "";
    }

    // Generate referral code if doesn't exist
    if (!referralCode) {
      referralCode = `REF-${ctx.userId.toString().slice(-8).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
      
      if (ctx.role === "HOST") {
        await HostProfile.findOneAndUpdate(
          { userId: ctx.userId },
          { $set: { referralCode } }
        );
      } else {
        await GuestProfile.findOneAndUpdate(
          { userId: ctx.userId },
          { $set: { referralCode } }
        );
      }
    }

    // Get referral stats
    const referrals = await Referral.find({
      referrerUserId: ctx.userId
    }).lean();

    referralStats.totalReferrals = referrals.length;
    referralStats.completedReferrals = referrals.filter((r: any) => r.status === "COMPLETED" || r.status === "REWARDED").length;
    referralStats.totalRewardsEarned = referrals
      .filter((r: any) => r.rewardCredited)
      .reduce((sum: number, r: any) => sum + (r.referrerReward || 0), 0);
    referralStats.pendingRewards = referrals
      .filter((r: any) => r.status === "COMPLETED" && !r.rewardCredited)
      .reduce((sum: number, r: any) => sum + (r.referrerReward || 0), 0);

    return createResponse({
      referralCode,
      stats: referralStats,
      referrals: referrals.slice(0, 10).map((r: any) => ({
        id: String(r._id),
        referredUserId: String(r.referredUserId),
        referralType: r.referralType,
        status: r.status,
        referrerReward: r.referrerReward,
        rewardCredited: r.rewardCredited,
        createdAt: r.createdAt
      }))
    });
  } catch (error: any) {
    return createResponse({ error: error.message }, { status: 401 });
  }
}

// Use a referral code
export async function POST(req: NextRequest) {
  try {
    const ctx = await requireAuth(req);
    await connectMongo();

    const body = await req.json();
    const { referralCode, referralType } = body;

    if (!referralCode) {
      return createResponse({ error: "Referral code is required" }, { status: 400 });
    }

    // Find referral code owner
    let referrerUserId: string | null = null;
    
    if (referralType === "GUEST_TO_HOST" || referralType === "HOST_TO_HOST") {
      const hostProfile = await HostProfile.findOne({ referralCode }).lean();
      referrerUserId = hostProfile ? String((hostProfile as any).userId) : null;
    } else {
      const guestProfile = await GuestProfile.findOne({ referralCode }).lean();
      referrerUserId = guestProfile ? String((guestProfile as any).userId) : null;
    }

    if (!referrerUserId) {
      return createResponse({ error: "Invalid referral code" }, { status: 400 });
    }

    if (String(referrerUserId) === String(ctx.userId)) {
      return createResponse({ error: "Cannot use your own referral code" }, { status: 400 });
    }

    // Check if already used
    const existing = await Referral.findOne({
      referrerUserId,
      referredUserId: ctx.userId,
      referralCode
    });

    if (existing) {
      return createResponse({ error: "Referral code already used" }, { status: 400 });
    }

    // Create referral record
    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + 3); // 3 months expiry

    const referral = await Referral.create({
      referrerUserId,
      referredUserId: ctx.userId,
      referralCode,
      referralType: referralType || (ctx.role === "HOST" ? "HOST_TO_HOST" : "GUEST_TO_GUEST"),
      status: "PENDING",
      expiresAt
    });

    return createResponse({
      success: true,
      referralId: String(referral._id),
      message: "Referral code applied successfully! Rewards will be credited after first booking/event."
    });
  } catch (error: any) {
    return createResponse({ error: error.message }, { status: 401 });
  }
}
