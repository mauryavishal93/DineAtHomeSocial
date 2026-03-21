import { NextRequest } from "next/server";
import { requireAuth } from "@/server/auth/rbac";
import { connectMongo } from "@/server/db/mongoose";
import { ChatMessage } from "@/server/models/ChatMessage";
import { EventSlot } from "@/server/models/EventSlot";
import { Booking } from "@/server/models/Booking";
import { User } from "@/server/models/User";
import { createResponse } from "@/server/http/response";
import { buildChatThreadFilter } from "@/server/services/chatThread";

const BOOKING_OK = ["CONFIRMED", "PAYMENT_PENDING"] as const;

async function resolveThreadAccess(
  ctx: { userId: string; role: string },
  eventSlotId: string,
  bookingIdParam: string | null
): Promise<
  | { ok: true; booking: any; eventDoc: any; isHost: boolean; threadFilter: ReturnType<typeof buildChatThreadFilter> }
  | { ok: false; status: number; error: string }
> {
  const event = await EventSlot.findById(eventSlotId).lean();
  if (!event) {
    return { ok: false, status: 404, error: "Event not found" };
  }

  const eventDoc = event as any;
  const isHost = String(eventDoc.hostUserId) === String(ctx.userId);

  let booking: any = null;

  if (isHost) {
    if (!bookingIdParam) {
      return { ok: false, status: 400, error: "bookingId is required for host chat" };
    }
    booking = await Booking.findOne({
      _id: bookingIdParam,
      eventSlotId,
      hostUserId: ctx.userId
    }).lean();
  } else {
    if (bookingIdParam) {
      booking = await Booking.findOne({
        _id: bookingIdParam,
        eventSlotId,
        guestUserId: ctx.userId
      }).lean();
    } else {
      booking = await Booking.findOne({
        eventSlotId,
        guestUserId: ctx.userId
      }).lean();
    }
  }

  if (!booking) {
    return { ok: false, status: 403, error: "Access denied" };
  }

  const bookingDoc = booking as any;
  if (bookingDoc.status === "CANCELLED") {
    return {
      ok: false,
      status: 403,
      error: "Chat is closed. Your booking for this event has been cancelled."
    };
  }
  if (!BOOKING_OK.includes(bookingDoc.status)) {
    return { ok: false, status: 403, error: "Access denied" };
  }

  const threadFilter = buildChatThreadFilter({
    eventSlotId,
    bookingId: String(bookingDoc._id),
    hostUserId: String(bookingDoc.hostUserId),
    guestUserId: String(bookingDoc.guestUserId)
  });

  return {
    ok: true,
    booking: bookingDoc,
    eventDoc,
    isHost,
    threadFilter
  };
}

// Get messages for a host–guest thread (per booking)
export async function GET(req: NextRequest) {
  try {
    const ctx = await requireAuth(req);
    await connectMongo();

    const url = new URL(req.url);
    const eventSlotId = url.searchParams.get("eventSlotId");
    const bookingIdParam = url.searchParams.get("bookingId");

    if (!eventSlotId) {
      return createResponse({ error: "eventSlotId is required" }, { status: 400 });
    }

    const access = await resolveThreadAccess(ctx, eventSlotId, bookingIdParam);
    if (!access.ok) {
      return createResponse({ error: access.error }, { status: access.status });
    }

    const { eventDoc, booking, isHost, threadFilter } = access;

    const isEventCancelled = eventDoc.status === "CANCELLED";
    const eventEndTime = eventDoc.endAt ? new Date(eventDoc.endAt) : null;
    const isPastEnd = eventEndTime && eventEndTime < new Date();
    const chatClosed = isEventCancelled || isPastEnd;

    let otherPartyName = "";
    if (isHost) {
      otherPartyName = booking.guestName || "Guest";
    } else {
      const hostUser = await User.findById(eventDoc.hostUserId).lean();
      otherPartyName = (hostUser as any)?.name || "Host";
      const { HostProfile } = await import("@/server/models/HostProfile");
      const hostProfile = await HostProfile.findOne({ userId: eventDoc.hostUserId }).lean();
      if (hostProfile) {
        const hn = `${(hostProfile as any).firstName || ""} ${(hostProfile as any).lastName || ""}`.trim();
        if (hn) otherPartyName = hn;
      }
    }

    const responseData: any = {
      isEventEnded: chatClosed,
      eventName: eventDoc.eventName || "Event",
      otherPartyName,
      bookingId: String(booking._id)
    };

    const messages = await ChatMessage.find(threadFilter).sort({ createdAt: 1 }).limit(200).lean();

    await ChatMessage.updateMany(
      {
        ...threadFilter,
        senderUserId: { $ne: ctx.userId },
        readBy: { $ne: ctx.userId }
      },
      { $addToSet: { readBy: ctx.userId } }
    );

    const messagesWithDetails = await Promise.all(
      messages.map(async (msg: any) => {
        const sender = await User.findById(msg.senderUserId).lean();
        const senderDoc = sender as any;

        let registeredName = "Unknown";
        if (senderDoc) {
          if (senderDoc.role === "HOST") {
            const { HostProfile } = await import("@/server/models/HostProfile");
            const hostProfile = await HostProfile.findOne({ userId: msg.senderUserId }).lean();
            if (hostProfile) {
              registeredName =
                `${(hostProfile as any).firstName || ""} ${(hostProfile as any).lastName || ""}`.trim() ||
                senderDoc.name ||
                "Host";
            } else {
              registeredName = senderDoc.name || "Host";
            }
          } else {
            const { GuestProfile } = await import("@/server/models/GuestProfile");
            const guestProfile = await GuestProfile.findOne({ userId: msg.senderUserId }).lean();
            if (guestProfile) {
              registeredName =
                `${(guestProfile as any).firstName || ""} ${(guestProfile as any).lastName || ""}`.trim() ||
                senderDoc.name ||
                "Guest";
            } else {
              registeredName = senderDoc.name || "Guest";
            }
          }
        }

        return {
          id: String(msg._id),
          eventSlotId: String(msg.eventSlotId),
          bookingId: msg.bookingId ? String(msg.bookingId) : "",
          senderUserId: String(msg.senderUserId),
          senderName: registeredName,
          senderRole: msg.senderRole,
          message: msg.message,
          messageType: msg.messageType,
          imageUrl: msg.imageUrl,
          createdAt: msg.createdAt,
          isRead: Array.isArray(msg.readBy) && msg.readBy.some((id: any) => String(id) === String(ctx.userId))
        };
      })
    );

    responseData.messages = messagesWithDetails;
    return createResponse(responseData);
  } catch (error: any) {
    return createResponse({ error: error.message }, { status: 401 });
  }
}

// Send a message (stored ciphertext if client sends ENC1:... payload)
export async function POST(req: NextRequest) {
  try {
    const ctx = await requireAuth(req);
    await connectMongo();

    const body = await req.json();
    const { eventSlotId, bookingId: bookingIdBody, message, messageType = "TEXT", imageUrl = "" } = body;

    if (!eventSlotId || !message) {
      return createResponse({ error: "eventSlotId and message are required" }, { status: 400 });
    }

    const access = await resolveThreadAccess(ctx, eventSlotId, bookingIdBody ? String(bookingIdBody) : null);
    if (!access.ok) {
      return createResponse({ error: access.error }, { status: access.status });
    }

    const { eventDoc, booking, isHost } = access;

    if (eventDoc.status === "CANCELLED") {
      return createResponse({ error: "Chat is closed. This event has been cancelled." }, { status: 403 });
    }

    const eventEndTime = eventDoc.endAt ? new Date(eventDoc.endAt) : null;
    if (eventEndTime && eventEndTime < new Date()) {
      return createResponse({ error: "Chat is closed. This event has ended." }, { status: 403 });
    }

    const user = await User.findById(ctx.userId).lean();
    const userDoc = user as any;

    let registeredName = "Unknown";
    if (userDoc) {
      if (ctx.role === "HOST") {
        const { HostProfile } = await import("@/server/models/HostProfile");
        const hostProfile = await HostProfile.findOne({ userId: ctx.userId }).lean();
        if (hostProfile) {
          registeredName =
            `${(hostProfile as any).firstName || ""} ${(hostProfile as any).lastName || ""}`.trim() ||
            userDoc.name ||
            "Host";
        } else {
          registeredName = userDoc.name || "Host";
        }
      } else {
        const { GuestProfile } = await import("@/server/models/GuestProfile");
        const guestProfile = await GuestProfile.findOne({ userId: ctx.userId }).lean();
        if (guestProfile) {
          registeredName =
            `${(guestProfile as any).firstName || ""} ${(guestProfile as any).lastName || ""}`.trim() ||
            userDoc.name ||
            "Guest";
        } else {
          registeredName = userDoc.name || "Guest";
        }
      }
    }

    const chatMessage = await ChatMessage.create({
      eventSlotId,
      bookingId: booking._id,
      senderUserId: ctx.userId,
      senderName: registeredName,
      senderRole: ctx.role,
      message,
      messageType,
      imageUrl,
      readBy: [ctx.userId]
    });

    const { Notification } = await import("@/server/models/Notification");

    if (isHost) {
      await Notification.create({
        userId: booking.guestUserId,
        title: "New Message",
        message: `${registeredName} sent you a private message about "${eventDoc.eventName}".`,
        type: "NEW_MESSAGE",
        relatedEventId: eventSlotId,
        relatedBookingId: String(booking._id),
        relatedUserId: ctx.userId,
        metadata: {
          eventId: eventSlotId,
          bookingId: String(booking._id),
          senderId: ctx.userId,
          senderName: registeredName,
          e2e: String(message).startsWith("ENC1:")
        },
        isRead: false
      });
    } else {
      await Notification.create({
        userId: eventDoc.hostUserId,
        title: "New Message",
        message: `${registeredName} sent you a private message about "${eventDoc.eventName}".`,
        type: "NEW_MESSAGE",
        relatedEventId: eventSlotId,
        relatedBookingId: String(booking._id),
        relatedUserId: ctx.userId,
        metadata: {
          eventId: eventSlotId,
          bookingId: String(booking._id),
          senderId: ctx.userId,
          senderName: registeredName,
          e2e: String(message).startsWith("ENC1:")
        },
        isRead: false
      });
    }

    return createResponse({
      success: true,
      message: {
        id: String(chatMessage._id),
        eventSlotId: String(eventSlotId),
        bookingId: String(booking._id),
        senderUserId: String(ctx.userId),
        senderName: registeredName,
        senderRole: ctx.role,
        message,
        messageType,
        imageUrl,
        createdAt: chatMessage.createdAt,
        isRead: true
      }
    });
  } catch (error: any) {
    return createResponse({ error: error.message }, { status: 401 });
  }
}
