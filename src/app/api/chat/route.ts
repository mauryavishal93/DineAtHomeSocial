import { NextRequest } from "next/server";
import { requireAuth } from "@/server/auth/rbac";
import { connectMongo } from "@/server/db/mongoose";
import { ChatMessage } from "@/server/models/ChatMessage";
import { EventSlot } from "@/server/models/EventSlot";
import { Booking } from "@/server/models/Booking";
import { User } from "@/server/models/User";
import { createResponse } from "@/server/http/response";

// Get messages for an event
export async function GET(req: NextRequest) {
  try {
    const ctx = await requireAuth(req);
    await connectMongo();

    const url = new URL(req.url);
    const eventSlotId = url.searchParams.get("eventSlotId");

    if (!eventSlotId) {
      return createResponse({ error: "eventSlotId is required" }, { status: 400 });
    }

    // Verify user has access to this event (either host or guest with booking)
    const event = await EventSlot.findById(eventSlotId).lean();
    if (!event) {
      return createResponse({ error: "Event not found" }, { status: 404 });
    }

    const eventDoc = event as any;
    const isHost = String(eventDoc.hostUserId) === String(ctx.userId);
    
    // Check if event has ended
    const eventEndTime = eventDoc.endAt ? new Date(eventDoc.endAt) : null;
    const isEventEnded = eventEndTime && eventEndTime < new Date();
    
    if (!isHost) {
      // Single query to check booking status (optimized)
      const booking = await Booking.findOne({
        eventSlotId,
        guestUserId: ctx.userId
      }).lean();
      
      if (!booking) {
        return createResponse({ error: "Access denied" }, { status: 403 });
      }
      
      const bookingDoc = booking as any;
      
      if (bookingDoc.status === "CANCELLED") {
        return createResponse({ 
          error: "Chat is closed. Your booking for this event has been cancelled." 
        }, { status: 403 });
      }
      
      if (!["CONFIRMED", "PAYMENT_PENDING", "COMPLETED"].includes(bookingDoc.status)) {
        return createResponse({ error: "Access denied" }, { status: 403 });
      }
    }
    
    // Return event status along with messages
    const responseData: any = { 
      isEventEnded: !!isEventEnded,
      eventName: eventDoc.eventName || "Event"
    };
    
    // Get messages
    const messages = await ChatMessage.find({
      eventSlotId,
      isDeleted: false
    })
      .sort({ createdAt: 1 })
      .limit(100)
      .lean();

    // Mark messages as read
    await ChatMessage.updateMany(
      {
        eventSlotId,
        senderUserId: { $ne: ctx.userId },
        readBy: { $ne: ctx.userId }
      },
      {
        $addToSet: { readBy: ctx.userId }
      }
    );

    // Get sender details with proper registered names
    const messagesWithDetails = await Promise.all(
      messages.map(async (msg: any) => {
        const sender = await User.findById(msg.senderUserId).lean();
        const senderDoc = sender as any;
        
        // Get proper registered name based on role
        let registeredName = "Unknown";
        if (senderDoc) {
          if (senderDoc.role === "HOST") {
            // For hosts, try to get from HostProfile
            const { HostProfile } = await import("@/server/models/HostProfile");
            const hostProfile = await HostProfile.findOne({ userId: msg.senderUserId }).lean();
            if (hostProfile) {
              registeredName = `${(hostProfile as any).firstName || ""} ${(hostProfile as any).lastName || ""}`.trim() || senderDoc.name || "Host";
            } else {
              registeredName = senderDoc.name || "Host";
            }
          } else {
            // For guests, try to get from GuestProfile
            const { GuestProfile } = await import("@/server/models/GuestProfile");
            const guestProfile = await GuestProfile.findOne({ userId: msg.senderUserId }).lean();
            if (guestProfile) {
              registeredName = `${(guestProfile as any).firstName || ""} ${(guestProfile as any).lastName || ""}`.trim() || senderDoc.name || "Guest";
            } else {
              registeredName = senderDoc.name || "Guest";
            }
          }
        }
        
        return {
          id: String(msg._id),
          eventSlotId: String(msg.eventSlotId),
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

// Send a message
export async function POST(req: NextRequest) {
  try {
    const ctx = await requireAuth(req);
    await connectMongo();

    const body = await req.json();
    const { eventSlotId, message, messageType = "TEXT", imageUrl = "" } = body;

    if (!eventSlotId || !message) {
      return createResponse({ error: "eventSlotId and message are required" }, { status: 400 });
    }

    // Verify user has access to this event
    const event = await EventSlot.findById(eventSlotId).lean();
    if (!event) {
      return createResponse({ error: "Event not found" }, { status: 404 });
    }

    const eventDoc = event as any;
    const isHost = String(eventDoc.hostUserId) === String(ctx.userId);
    
    // Check if event has ended - if so, disable sending messages
    const eventEndTime = eventDoc.endAt ? new Date(eventDoc.endAt) : null;
    const isEventEnded = eventEndTime && eventEndTime < new Date();
    
    if (isEventEnded) {
      return createResponse({ error: "Chat is closed. This event has ended." }, { status: 403 });
    }
    
    if (!isHost) {
      // Single query to check booking status (optimized)
      const booking = await Booking.findOne({
        eventSlotId,
        guestUserId: ctx.userId
      }).lean();
      
      if (!booking) {
        return createResponse({ error: "Access denied" }, { status: 403 });
      }
      
      const bookingDoc = booking as any;
      
      if (bookingDoc.status === "CANCELLED") {
        return createResponse({ 
          error: "Chat is closed. Your booking for this event has been cancelled." 
        }, { status: 403 });
      }
      
      if (!["CONFIRMED", "PAYMENT_PENDING", "COMPLETED"].includes(bookingDoc.status)) {
        return createResponse({ error: "Access denied" }, { status: 403 });
      }
    }

    // Get user details with proper registered name
    const user = await User.findById(ctx.userId).lean();
    const userDoc = user as any;
    
    let registeredName = "Unknown";
    if (userDoc) {
      if (ctx.role === "HOST") {
        // For hosts, get from HostProfile
        const { HostProfile } = await import("@/server/models/HostProfile");
        const hostProfile = await HostProfile.findOne({ userId: ctx.userId }).lean();
        if (hostProfile) {
          registeredName = `${(hostProfile as any).firstName || ""} ${(hostProfile as any).lastName || ""}`.trim() || userDoc.name || "Host";
        } else {
          registeredName = userDoc.name || "Host";
        }
      } else {
        // For guests, get from GuestProfile
        const { GuestProfile } = await import("@/server/models/GuestProfile");
        const guestProfile = await GuestProfile.findOne({ userId: ctx.userId }).lean();
        if (guestProfile) {
          registeredName = `${(guestProfile as any).firstName || ""} ${(guestProfile as any).lastName || ""}`.trim() || userDoc.name || "Guest";
        } else {
          registeredName = userDoc.name || "Guest";
        }
      }
    }

    // Create message
    const chatMessage = await ChatMessage.create({
      eventSlotId,
      senderUserId: ctx.userId,
      senderName: registeredName,
      senderRole: ctx.role,
      message,
      messageType,
      imageUrl,
      readBy: [ctx.userId] // Sender has read their own message
    });

    // Create notifications for all participants in the conversation
    const { Notification } = await import("@/server/models/Notification");
    const notificationPromises: Promise<any>[] = [];
    
    if (isHost) {
      // Notify all guests who have bookings for this event
      const bookings = await Booking.find({ 
        eventSlotId, 
        status: { $in: ["CONFIRMED", "PAYMENT_PENDING"] } 
      }).select("guestUserId").lean();
      
      const guestUserIds = [...new Set(bookings.map((b: any) => String(b.guestUserId)))];
      
      guestUserIds.forEach((guestId) => {
        if (String(guestId) !== String(ctx.userId)) {
          notificationPromises.push(
            Notification.create({
              userId: guestId,
              title: "New Message",
              message: `${registeredName} sent a message in "${eventDoc.eventName}" chat`,
              type: "NEW_MESSAGE",
              metadata: {
                eventId: eventSlotId,
                senderId: ctx.userId,
                senderName: registeredName
              },
              isRead: false
            })
          );
        }
      });
    } else {
      // Notify the host
      if (String(eventDoc.hostUserId) !== String(ctx.userId)) {
        notificationPromises.push(
          Notification.create({
            userId: eventDoc.hostUserId,
            title: "New Message",
            message: `${registeredName} sent a message in "${eventDoc.eventName}" chat`,
            type: "NEW_MESSAGE",
            metadata: {
              eventId: eventSlotId,
              senderId: ctx.userId,
              senderName: registeredName
            },
            isRead: false
          })
        );
      }
    }
    
    // Create all notifications in parallel
    await Promise.all(notificationPromises);

    return createResponse({
      success: true,
      message: {
        id: String(chatMessage._id),
        eventSlotId: String(eventSlotId),
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
