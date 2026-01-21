import { NextRequest } from "next/server";
import { requireAuth } from "@/server/auth/rbac";
import { connectMongo } from "@/server/db/mongoose";
import { EventPhoto } from "@/server/models/EventPhoto";
import { EventSlot } from "@/server/models/EventSlot";
import { Booking } from "@/server/models/Booking";
import { createResponse } from "@/server/http/response";

// Get photos for an event
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    await connectMongo();
    const { eventId } = await params;

    const photos = await EventPhoto.find({
      eventSlotId: eventId,
      isPublic: true,
      isApproved: true
    })
      .populate({ path: "uploadedBy", select: "name" })
      .sort({ createdAt: -1 })
      .lean();

    return createResponse({
      photos: photos.map((photo: any) => ({
        id: String(photo._id),
        imageUrl: photo.imageUrl,
        caption: photo.caption || "",
        uploadedBy: photo.uploadedBy?.name || "Unknown",
        uploaderRole: photo.uploaderRole,
        likeCount: photo.likeCount || 0,
        createdAt: photo.createdAt
      }))
    });
  } catch (error: any) {
    return createResponse({ error: error.message }, { status: 500 });
  }
}

// Upload a photo
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const ctx = await requireAuth(req);
    await connectMongo();
    const { eventId } = await params;

    const body = await req.json();
    const { imageUrl, caption = "" } = body;

    if (!imageUrl) {
      return createResponse({ error: "imageUrl is required" }, { status: 400 });
    }

    // Verify user has access (host or guest with booking)
    const event = await EventSlot.findById(eventId).lean();
    if (!event) {
      return createResponse({ error: "Event not found" }, { status: 404 });
    }

    const eventDoc = event as any;
    const isHost = String(eventDoc.hostUserId) === String(ctx.userId);

    if (!isHost) {
      // Check if guest has a booking
      const booking = await Booking.findOne({
        eventSlotId: eventId,
        guestUserId: ctx.userId,
        status: { $in: ["CONFIRMED", "COMPLETED"] }
      });

      if (!booking) {
        return createResponse({ error: "Access denied" }, { status: 403 });
      }
    }

    // Create photo
    const photo = await EventPhoto.create({
      eventSlotId: eventId,
      uploadedBy: ctx.userId,
      uploaderRole: ctx.role,
      imageUrl,
      caption,
      isApproved: isHost, // Host photos auto-approved, guest photos need approval
      isPublic: true
    });

    return createResponse({
      success: true,
      photo: {
        id: String(photo._id),
        imageUrl: photo.imageUrl,
        caption: photo.caption,
        isApproved: photo.isApproved
      }
    });
  } catch (error: any) {
    return createResponse({ error: error.message }, { status: 401 });
  }
}
