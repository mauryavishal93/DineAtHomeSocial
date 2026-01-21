import { NextRequest } from "next/server";
import { requireAuth } from "@/server/auth/rbac";
import { connectMongo } from "@/server/db/mongoose";
import { ChatMessage } from "@/server/models/ChatMessage";
import { EventSlot } from "@/server/models/EventSlot";
import { Booking } from "@/server/models/Booking";
import { User } from "@/server/models/User";
import { Venue } from "@/server/models/Venue";
import { createResponse } from "@/server/http/response";

// Get all conversations for the current user
export async function GET(req: NextRequest) {
  try {
    const ctx = await requireAuth(req);
    await connectMongo();

    // Get all events where user has messages (as host or guest)
    const messages = await ChatMessage.find({
      $or: [
        { senderUserId: ctx.userId },
        { eventSlotId: { $exists: true } }
      ]
    })
      .select("eventSlotId")
      .distinct("eventSlotId")
      .lean();

    const conversations = await Promise.all(
      messages.map(async (eventSlotId: any) => {
        const event = await EventSlot.findById(eventSlotId)
          .populate({ path: "venueId", select: "name address" })
          .populate({ path: "hostUserId", select: "name" })
          .lean();

        if (!event) return null;

        const eventDoc = event as any;
        const isHost = String(eventDoc.hostUserId?._id || eventDoc.hostUserId) === String(ctx.userId);
        
        // Check if event has ended
        const eventEndTime = eventDoc.endAt ? new Date(eventDoc.endAt) : null;
        const isEventEnded = eventEndTime && eventEndTime < new Date();

        // Get latest message
        const latestMessage = await ChatMessage.findOne({
          eventSlotId
        })
          .sort({ createdAt: -1 })
          .lean();

        // Get unread count
        const unreadCount = await ChatMessage.countDocuments({
          eventSlotId,
          senderUserId: { $ne: ctx.userId },
          readBy: { $ne: ctx.userId }
        });

        // Get other party info
        let otherPartyName = "";
        let otherPartyId = "";

        if (isHost) {
          // Get first guest booking
          const booking = await Booking.findOne({
            eventSlotId,
            status: { $in: ["CONFIRMED", "PAYMENT_PENDING", "COMPLETED"] }
          })
            .populate({ path: "guestUserId", select: "name" })
            .lean();
          
          if (booking) {
            const bookingDoc = booking as any;
            otherPartyName = bookingDoc.guestUserId?.name || bookingDoc.guestName || "Guest";
            otherPartyId = String(bookingDoc.guestUserId?._id || bookingDoc.guestUserId);
          }
        } else {
          otherPartyName = eventDoc.hostUserId?.name || "Host";
          otherPartyId = String(eventDoc.hostUserId?._id || eventDoc.hostUserId);
        }

        return {
          eventSlotId: String(eventSlotId),
          eventName: eventDoc.eventName || "Event",
          eventDate: eventDoc.startAt,
          venueName: eventDoc.venueId?.name || "",
          venueAddress: eventDoc.venueId?.address || "",
          otherPartyName,
          otherPartyId,
          otherPartyRole: isHost ? "GUEST" : "HOST",
          latestMessage: latestMessage ? {
            message: (latestMessage as any).message,
            senderName: (latestMessage as any).senderName,
            createdAt: (latestMessage as any).createdAt
          } : null,
          unreadCount,
          isHost,
          isEventEnded
        };
      })
    );

    // Filter out nulls and sort by latest message
    const validConversations = conversations
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
