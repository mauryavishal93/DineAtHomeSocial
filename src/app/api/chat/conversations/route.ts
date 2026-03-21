import { NextRequest } from "next/server";
import { requireAuth } from "@/server/auth/rbac";
import { connectMongo } from "@/server/db/mongoose";
import { ChatMessage } from "@/server/models/ChatMessage";
import { EventSlot } from "@/server/models/EventSlot";
import { Booking } from "@/server/models/Booking";
import { User } from "@/server/models/User";
import { HostProfile } from "@/server/models/HostProfile";
import { GuestProfile } from "@/server/models/GuestProfile";
import { createResponse } from "@/server/http/response";
import { buildChatThreadFilter } from "@/server/services/chatThread";

const BOOKING_OK = ["CONFIRMED", "PAYMENT_PENDING"] as const;

async function displayNameForUser(userId: string, roleHint?: string): Promise<string> {
  const user = await User.findById(userId).lean();
  const u = user as any;
  if (!u) return "User";

  if (roleHint === "HOST" || u.role === "HOST") {
    const hp = await HostProfile.findOne({ userId }).lean();
    if (hp) {
      const n = `${(hp as any).firstName || ""} ${(hp as any).lastName || ""}`.trim();
      if (n) return n;
    }
    return u.name || "Host";
  }

  const gp = await GuestProfile.findOne({ userId }).lean();
  if (gp) {
    const n = `${(gp as any).firstName || ""} ${(gp as any).lastName || ""}`.trim();
    if (n) return n;
  }
  return u.name || "Guest";
}

// One row per booking (host ↔ guest thread)
export async function GET(req: NextRequest) {
  try {
    const ctx = await requireAuth(req);
    await connectMongo();

    const bookings = await Booking.find({
      $or: [{ guestUserId: ctx.userId }, { hostUserId: ctx.userId }],
      status: { $in: [...BOOKING_OK] }
    })
      .sort({ updatedAt: -1 })
      .limit(80)
      .lean();

    const rows = await Promise.all(
      bookings.map(async (b: any) => {
        const event = await EventSlot.findById(b.eventSlotId)
          .populate({ path: "venueId", select: "name address" })
          .lean();

        if (!event) return null;

        const eventDoc = event as any;
        const isHost = String(b.hostUserId) === String(ctx.userId);
        const hostUserId = String(b.hostUserId);
        const guestUserId = String(b.guestUserId);
        const bookingId = String(b._id);
        const eventSlotId = String(b.eventSlotId);

        const eventEndTime = eventDoc.endAt ? new Date(eventDoc.endAt) : null;
        const isEventEnded = !!(eventEndTime && eventEndTime < new Date());

        const threadFilter = buildChatThreadFilter({
          eventSlotId,
          bookingId,
          hostUserId,
          guestUserId
        });

        const latestMessage = await ChatMessage.findOne(threadFilter).sort({ createdAt: -1 }).lean();

        const unreadCount = await ChatMessage.countDocuments({
          ...threadFilter,
          senderUserId: { $ne: ctx.userId },
          readBy: { $ne: ctx.userId }
        });

        let otherPartyName = "";
        let otherPartyId = "";
        if (isHost) {
          otherPartyId = guestUserId;
          otherPartyName = b.guestName || (await displayNameForUser(guestUserId, "GUEST"));
        } else {
          otherPartyId = hostUserId;
          otherPartyName = await displayNameForUser(hostUserId, "HOST");
        }

        const lm = latestMessage as any;
        const preview = lm?.message
          ? String(lm.message).startsWith("ENC1:")
            ? "🔒 Encrypted message"
            : lm.message
          : "";

        return {
          bookingId,
          eventSlotId,
          eventName: eventDoc.eventName || "Event",
          eventDate: eventDoc.startAt,
          venueName: eventDoc.venueId?.name || "",
          venueAddress: eventDoc.venueId?.address || "",
          otherPartyName,
          otherPartyId,
          otherPartyRole: isHost ? "GUEST" : "HOST",
          latestMessage: lm
            ? {
                message: preview,
                senderName: lm.senderName || "",
                createdAt: lm.createdAt
              }
            : null,
          unreadCount,
          isHost,
          isEventEnded
        };
      })
    );

    const validConversations = rows
      .filter(Boolean)
      .sort((a: any, b: any) => {
        if (!a.latestMessage) return 1;
        if (!b.latestMessage) return -1;
        return new Date(b.latestMessage.createdAt).getTime() - new Date(a.latestMessage.createdAt).getTime();
      });

    return createResponse({ conversations: validConversations });
  } catch (error: any) {
    return createResponse({ error: error.message }, { status: 401 });
  }
}
