import { ok, unauthorized, serverError } from "@/server/http/response";
import { requireAdminAuth } from "@/server/auth/rbac";
import { connectMongo } from "@/server/db/mongoose";
import { Wallet } from "@/server/models/Wallet";
import { User } from "@/server/models/User";
import { HostProfile } from "@/server/models/HostProfile";
import { GuestProfile } from "@/server/models/GuestProfile";

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    const ctx = await requireAdminAuth(req as unknown as { headers: Headers });

    const url = new URL(req.url);
    const roleParam = url.searchParams.get("role");
    const search = url.searchParams.get("search") || "";
    const page = Number.parseInt(url.searchParams.get("page") || "1", 10);
    const limit = Number.parseInt(url.searchParams.get("limit") || "20", 10);
    const skip = (page - 1) * limit;

    await connectMongo();

    // Build wallet query
    const walletQuery: any = {};

    // If search or role filter, find matching users first
    if (search || roleParam) {
      const userQuery: any = {};
      if (roleParam) {
        userQuery.role = roleParam;
      }
      if (search) {
        userQuery.$or = [
          { email: { $regex: search, $options: "i" } },
          { mobile: { $regex: search, $options: "i" } }
        ];
      }

      // Get users matching the query
      const users = await User.find(userQuery).select("_id").lean();
      const userIds = users.map(u => String(u._id));

      if (userIds.length === 0) {
        // No users match, return empty result
        return ok({ wallets: [], total: 0, page, limit });
      }

      walletQuery.userId = { $in: userIds };
    }

    const total = await Wallet.countDocuments(walletQuery);
    const wallets = await Wallet.find(walletQuery)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Get user details
    const walletUserIds = wallets.map(w => String((w as any).userId));
    const walletUsers = await User.find({ _id: { $in: walletUserIds } }).lean();
    const userMap = new Map(walletUsers.map(u => [String(u._id), u]));

    // Get profiles for names
    const hostProfiles = await HostProfile.find({ userId: { $in: walletUserIds } }).lean();
    const guestProfiles = await GuestProfile.find({ userId: { $in: walletUserIds } }).lean();
    const profileMap = new Map();
    hostProfiles.forEach((h: any) => {
      const name = `${h.firstName || ""} ${h.lastName || ""}`.trim() || "Host";
      profileMap.set(String(h.userId), name);
    });
    guestProfiles.forEach((g: any) => {
      const name = `${g.firstName || ""} ${g.lastName || ""}`.trim() || "Guest";
      profileMap.set(String(g.userId), name);
    });

    const walletsWithDetails = wallets.map((w: any) => {
      const user = userMap.get(String(w.userId));
      return {
        _id: String(w._id),
        userId: String(w.userId),
        userEmail: (user as any)?.email || "",
        userName: profileMap.get(String(w.userId)) || "User",
        role: (user as any)?.role || "",
        balance: w.balance || 0,
        pendingBalance: w.pendingBalance || 0,
        totalEarned: w.totalEarned || 0,
        totalWithdrawn: w.totalWithdrawn || 0,
        isFrozen: w.isFrozen || false,
        freezeReason: w.freezeReason || "",
        createdAt: w.createdAt
      };
    });

    return ok({ wallets: walletsWithDetails, total, page, limit });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    console.error("Admin wallets GET error:", msg);
    if (msg.toLowerCase().includes("unauthorized") || msg.toLowerCase().includes("invalid token")) {
      return unauthorized("Invalid or missing authentication token");
    }
    return serverError(`Failed to load wallets: ${msg}`);
  }
}
