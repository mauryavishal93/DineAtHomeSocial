import { NextRequest } from "next/server";
import { connectMongo } from "@/server/db/mongoose";
import { EventSlot } from "@/server/models/EventSlot";
import { createResponse } from "@/server/http/response";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    await connectMongo();
    const { eventId } = await params;

    const event = await EventSlot.findById(eventId)
      .populate({ path: "venueId", select: "name address" })
      .populate({ path: "hostUserId", select: "name" })
      .lean();

    if (!event) {
      return createResponse({ error: "Event not found" }, { status: 404 });
    }

    const eventDoc = event as any;
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const shareUrl = `${baseUrl}/events/${eventId}`;

    // Generate share text
    const shareText = `Check out "${eventDoc.eventName}" at ${eventDoc.venueId?.name}! ${shareUrl}`;

    return createResponse({
      shareUrl,
      shareText,
      eventName: eventDoc.eventName,
      venueName: eventDoc.venueId?.name,
      hostName: eventDoc.hostUserId?.name
    });
  } catch (error: any) {
    return createResponse({ error: error.message }, { status: 500 });
  }
}
