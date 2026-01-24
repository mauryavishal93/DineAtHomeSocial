import { ok, unauthorized, serverError } from "@/server/http/response";
import { requireAdminAuth } from "@/server/auth/rbac";
import { connectMongo } from "@/server/db/mongoose";
import { Withdrawal } from "@/server/models/Withdrawal";
import { User } from "@/server/models/User";
import { HostProfile } from "@/server/models/HostProfile";
import { GuestProfile } from "@/server/models/GuestProfile";

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    const ctx = await requireAdminAuth(req as unknown as { headers: Headers });

    const url = new URL(req.url);
    const statusParam = url.searchParams.get("status");
    const search = url.searchParams.get("search") || "";
    const page = Number.parseInt(url.searchParams.get("page") || "1", 10);
    const limit = Number.parseInt(url.searchParams.get("limit") || "20", 10);
    const skip = (page - 1) * limit;

    await connectMongo();

    // Build query
    const query: any = {};
    if (statusParam) {
      query.status = statusParam;
    }

    // If search, find users first
    let userIds: string[] = [];
    if (search) {
      const userQuery: any = {
        $or: [
          { email: { $regex: search, $options: "i" } },
          { mobile: { $regex: search, $options: "i" } }
        ]
      };
      const users = await User.find(userQuery).select("_id").lean();
      userIds = users.map(u => String(u._id));
      if (userIds.length === 0) {
        return ok({ withdrawals: [], total: 0, page, limit });
      }
      query.userId = { $in: userIds };
    }

    const total = await Withdrawal.countDocuments(query);
    const withdrawals = await Withdrawal.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    if (withdrawals.length === 0) {
      return ok({ withdrawals: [], total: 0, page, limit });
    }

    // Get user details
    const withdrawalUserIds = withdrawals.map(w => String((w as any).userId));
    const users = await User.find({ _id: { $in: withdrawalUserIds } }).lean();
    const userMap = new Map(users.map(u => [String(u._id), u]));

    // Get profiles for names
    const hostProfiles = await HostProfile.find({ userId: { $in: withdrawalUserIds } }).lean();
    const guestProfiles = await GuestProfile.find({ userId: { $in: withdrawalUserIds } }).lean();
    const profileMap = new Map();
    hostProfiles.forEach((h: any) => {
      const name = `${h.firstName || ""} ${h.lastName || ""}`.trim() || "Host";
      profileMap.set(String(h.userId), name);
    });
    guestProfiles.forEach((g: any) => {
      const name = `${g.firstName || ""} ${g.lastName || ""}`.trim() || "Guest";
      profileMap.set(String(g.userId), name);
    });

    const withdrawalsWithDetails = withdrawals.map((w: any) => {
      const user = userMap.get(String(w.userId));
      return {
        _id: String(w._id),
        userId: String(w.userId),
        userEmail: (user as any)?.email || "",
        userName: profileMap.get(String(w.userId)) || "User",
        amount: w.amount || 0,
        status: w.status || "PENDING",
        bankAccount: w.bankAccount || null,
        upiId: w.upiId || "",
        requestedAt: w.requestedAt,
        approvedAt: w.approvedAt || null,
        approvedBy: w.approvedBy ? String(w.approvedBy) : null,
        rejectedAt: w.rejectedAt || null,
        rejectedBy: w.rejectedBy ? String(w.rejectedBy) : null,
        rejectionReason: w.rejectionReason || "",
        paidAt: w.paidAt || null,
        paidBy: w.paidBy ? String(w.paidBy) : null,
        paymentReference: w.paymentReference || ""
      };
    });

    return ok({ withdrawals: withdrawalsWithDetails, total, page, limit });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    console.error("Admin withdrawals GET error:", msg);
    if (msg.toLowerCase().includes("unauthorized") || msg.toLowerCase().includes("invalid token")) {
      return unauthorized("Invalid or missing authentication token");
    }
    return serverError(`Failed to load withdrawals: ${msg}`);
  }
}
