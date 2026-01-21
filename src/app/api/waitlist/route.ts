import { NextRequest } from "next/server";
import { requireAuth } from "@/server/auth/rbac";
import { connectMongo } from "@/server/db/mongoose";
import { Waitlist } from "@/server/models/Waitlist";
import { EventSlot } from "@/server/models/EventSlot";
import { Booking } from "@/server/models/Booking";
import { createResponse } from "@/server/http/response";

// Join waitlist
export async function POST(req: NextRequest) {
  try {
    const ctx = await requireAuth(req);
    if (ctx.role !== "GUEST") {
      return createResponse({ error: "Only guests can join waitlist" }, { status: 403 });
    }

    await connectMongo();

    const body = await req.json();
    const { eventSlotId, seatsRequested = 1 } = body;

    if (!eventSlotId) {
      return createResponse({ error: "eventSlotId is required" }, { status: 400 });
    }

    // Check if event exists and is full
    const event = await EventSlot.findById(eventSlotId).lean();
    if (!event) {
      return createResponse({ error: "Event not found" }, { status: 404 });
    }

    const eventDoc = event as any;
    if (eventDoc.status !== "FULL") {
      return createResponse({ error: "Event is not full" }, { status: 400 });
    }

    // Check if already on waitlist
    const existing = await Waitlist.findOne({
      eventSlotId,
      guestUserId: ctx.userId,
      status: "WAITING"
    });

    if (existing) {
      return createResponse({ error: "Already on waitlist" }, { status: 400 });
    }

    // Check if user has previous bookings with this host (returning guest)
    const previousBooking = await Booking.findOne({
      hostUserId: eventDoc.hostUserId,
      guestUserId: ctx.userId,
      status: "COMPLETED"
    });

    const waitlist = await Waitlist.create({
      eventSlotId,
      guestUserId: ctx.userId,
      seatsRequested,
      status: "WAITING",
      priority: previousBooking ? 10 : 0,
      isReturningGuest: !!previousBooking
    });

    return createResponse({
      success: true,
      waitlistId: String(waitlist._id)
    });
  } catch (error: any) {
    return createResponse({ error: error.message }, { status: 401 });
  }
}

// Get waitlist for user
export async function GET(req: NextRequest) {
  try {
    const ctx = await requireAuth(req);
    await connectMongo();

    const url = new URL(req.url);
    const eventSlotId = url.searchParams.get("eventSlotId");

    if (eventSlotId) {
      // Get waitlist for specific event (for host)
      if (ctx.role !== "HOST") {
        return createResponse({ error: "Forbidden" }, { status: 403 });
      }

      const event = await EventSlot.findById(eventSlotId).lean();
      if (!event || String((event as any).hostUserId) !== String(ctx.userId)) {
        return createResponse({ error: "Forbidden" }, { status: 403 });
      }

      const waitlist = await Waitlist.find({
        eventSlotId,
        status: "WAITING"
      })
        .populate({ path: "guestUserId", select: "name email mobile" })
        .sort({ priority: -1, createdAt: 1 })
        .lean();

      return createResponse({
        waitlist: waitlist.map((w: any) => ({
          id: String(w._id),
          guestUserId: String(w.guestUserId?._id || w.guestUserId),
          guestName: w.guestUserId?.name || "Guest",
          seatsRequested: w.seatsRequested,
          priority: w.priority,
          isReturningGuest: w.isReturningGuest,
          createdAt: w.createdAt
        }))
      });
    } else {
      // Get user's waitlist (for guest)
      const waitlist = await Waitlist.find({
        guestUserId: ctx.userId,
        status: "WAITING"
      })
        .populate({ path: "eventSlotId", select: "eventName startAt endAt" })
        .sort({ createdAt: -1 })
        .lean();

      return createResponse({
        waitlist: waitlist.map((w: any) => ({
          id: String(w._id),
          eventSlotId: String(w.eventSlotId?._id || w.eventSlotId),
          eventName: w.eventSlotId?.eventName || "Event",
          eventDate: w.eventSlotId?.startAt,
          seatsRequested: w.seatsRequested,
          status: w.status,
          createdAt: w.createdAt
        }))
      });
    }
  } catch (error: any) {
    return createResponse({ error: error.message }, { status: 401 });
  }
}

// Remove from waitlist
export async function DELETE(req: NextRequest) {
  try {
    const ctx = await requireAuth(req);
    await connectMongo();

    const url = new URL(req.url);
    const waitlistId = url.searchParams.get("id");

    if (!waitlistId) {
      return createResponse({ error: "waitlistId is required" }, { status: 400 });
    }

    await Waitlist.deleteOne({
      _id: waitlistId,
      guestUserId: ctx.userId
    });

    return createResponse({ success: true });
  } catch (error: any) {
    return createResponse({ error: error.message }, { status: 401 });
  }
}
