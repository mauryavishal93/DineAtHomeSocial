import { ok, unauthorized, serverError } from "@/server/http/response";
import { requireAdminAuth } from "@/server/auth/rbac";
import { connectMongo } from "@/server/db/mongoose";
import { Dispute } from "@/server/models/Dispute";
import { User } from "@/server/models/User";
import { HostProfile } from "@/server/models/HostProfile";
import { GuestProfile } from "@/server/models/GuestProfile";

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    const ctx = await requireAdminAuth(req as unknown as { headers: Headers });

    const url = new URL(req.url);
    const statusParam = url.searchParams.get("status");
    const typeParam = url.searchParams.get("type");
    const priorityParam = url.searchParams.get("priority");
    const search = url.searchParams.get("search") || "";
    const page = Number.parseInt(url.searchParams.get("page") || "1", 10);
    const limit = Number.parseInt(url.searchParams.get("limit") || "20", 10);
    const skip = (page - 1) * limit;

    await connectMongo();

    // Build query
    const query: any = {};
    if (statusParam) query.status = statusParam;
    if (typeParam) query.disputeType = typeParam;
    if (priorityParam) query.priority = priorityParam;

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
      if (userIds.length > 0) {
        query.$or = [
          { hostUserId: { $in: userIds } },
          { guestUserId: { $in: userIds } }
        ];
      } else {
        return ok({ disputes: [], total: 0, page, limit });
      }
    }

    const total = await Dispute.countDocuments(query);
    const disputes = await Dispute.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    if (disputes.length === 0) {
      return ok({ disputes: [], total: 0, page, limit });
    }

    // Get user details
    const allUserIds = new Set<string>();
    disputes.forEach((d: any) => {
      allUserIds.add(String(d.hostUserId));
      allUserIds.add(String(d.guestUserId));
    });

    const users = await User.find({ _id: { $in: Array.from(allUserIds) } }).lean();
    const userMap = new Map(users.map(u => [String(u._id), u]));

    // Get profiles for names
    const hostProfiles = await HostProfile.find({ userId: { $in: Array.from(allUserIds) } }).lean();
    const guestProfiles = await GuestProfile.find({ userId: { $in: Array.from(allUserIds) } }).lean();
    const profileMap = new Map();
    hostProfiles.forEach((h: any) => {
      const name = `${h.firstName || ""} ${h.lastName || ""}`.trim() || "Host";
      profileMap.set(String(h.userId), name);
    });
    guestProfiles.forEach((g: any) => {
      const name = `${g.firstName || ""} ${g.lastName || ""}`.trim() || "Guest";
      profileMap.set(String(g.userId), name);
    });

    const disputesWithDetails = disputes.map((d: any) => ({
      _id: String(d._id),
      bookingId: String(d.bookingId),
      eventSlotId: String(d.eventSlotId),
      hostUserId: String(d.hostUserId),
      hostName: profileMap.get(String(d.hostUserId)) || "Host",
      guestUserId: String(d.guestUserId),
      guestName: profileMap.get(String(d.guestUserId)) || "Guest",
      disputeType: d.disputeType,
      status: d.status,
      title: d.title,
      description: d.description,
      evidence: d.evidence || [],
      requestedRefund: d.requestedRefund || 0,
      resolvedRefund: d.resolvedRefund || 0,
      resolution: d.resolution || "",
      resolvedBy: d.resolvedBy ? String(d.resolvedBy) : null,
      resolvedAt: d.resolvedAt || null,
      slaDeadline: d.slaDeadline || null,
      priority: d.priority || "MEDIUM",
      createdAt: d.createdAt
    }));

    return ok({ disputes: disputesWithDetails, total, page, limit });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    console.error("Admin disputes GET error:", msg);
    if (msg.toLowerCase().includes("unauthorized") || msg.toLowerCase().includes("invalid token")) {
      return unauthorized("Invalid or missing authentication token");
    }
    return serverError(`Failed to load disputes: ${msg}`);
  }
}
