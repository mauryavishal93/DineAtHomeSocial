import { NextRequest } from "next/server";
import { requireAuth } from "@/server/auth/rbac";
import { connectMongo } from "@/server/db/mongoose";
import { Waitlist } from "@/server/models/Waitlist";
import { EventSlot } from "@/server/models/EventSlot";
import { Notification } from "@/server/models/Notification";
import { createResponse } from "@/server/http/response";

// Notify waitlist users when seats become available
export async function POST(req: NextRequest) {
  try {
    const ctx = await requireAuth(req);
    if (ctx.role !== "HOST") {
      return createResponse({ error: "Forbidden" }, { status: 403 });
    }

    await connectMongo();

    const body = await req.json();
    const { eventSlotId, seatsAvailable } = body;

    if (!eventSlotId || !seatsAvailable) {
      return createResponse({ error: "eventSlotId and seatsAvailable are required" }, { status: 400 });
    }

    // Verify host owns the event
    const event = await EventSlot.findById(eventSlotId).lean();
    if (!event || String((event as any).hostUserId) !== String(ctx.userId)) {
      return createResponse({ error: "Forbidden" }, { status: 403 });
    }

    // Get waitlist users (prioritized)
    const waitlist = await Waitlist.find({
      eventSlotId,
      status: "WAITING"
    })
      .sort({ priority: -1, createdAt: 1 })
      .limit(seatsAvailable)
      .lean();

    let notifiedCount = 0;
    let totalSeatsNeeded = 0;

    for (const item of waitlist) {
      const w = item as any;
      totalSeatsNeeded += w.seatsRequested || 1;
      
      if (totalSeatsNeeded <= seatsAvailable) {
        // Update waitlist status
        await Waitlist.updateOne(
          { _id: w._id },
          {
            status: "NOTIFIED",
            notifiedAt: new Date(),
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
          }
        );

        // Create notification
        await Notification.create({
          userId: w.guestUserId,
          type: "SEAT_AVAILABLE",
          title: "Seats Available!",
          message: `Seats are now available for "${(event as any).eventName}". Book now before they're gone!`,
          relatedEventId: eventSlotId,
          metadata: {
            seatsAvailable: w.seatsRequested,
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
          }
        });

        notifiedCount++;
      }
    }

    return createResponse({
      success: true,
      notifiedCount,
      totalSeatsNeeded
    });
  } catch (error: any) {
    return createResponse({ error: error.message }, { status: 401 });
  }
}
