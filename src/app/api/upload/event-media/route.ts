import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";
import { requireAuth, requireRole } from "@/server/auth/rbac";
import { connectMongo } from "@/server/db/mongoose";
import { EventSlot } from "@/server/models/EventSlot";
import { serverError } from "@/server/http/response";

export const runtime = "nodejs";

const UPLOAD_DIR = process.env.UPLOAD_DIR || "./uploads";
const EVENT_IMAGES_DIR = join(UPLOAD_DIR, "event-images");
const EVENT_VIDEOS_DIR = join(UPLOAD_DIR, "event-videos");

// POST: Upload event images and videos
export async function POST(req: NextRequest) {
  try {
    const ctx = await requireAuth(req as any);
    requireRole(ctx, ["HOST"]);

    await connectMongo();

    const formData = await req.formData();
    const eventId = formData.get("eventId") as string;
    const imageFiles = formData.getAll("images") as File[];
    const videoFiles = formData.getAll("videos") as File[];

    if (!eventId) {
      return NextResponse.json({ error: "Event ID required" }, { status: 400 });
    }

    if (imageFiles.length === 0 && videoFiles.length === 0) {
      return NextResponse.json({ error: "No images or videos provided" }, { status: 400 });
    }

    // Verify host owns this event
    const event = await EventSlot.findById(eventId).lean();
    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    if (String((event as any).hostUserId) !== ctx.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Ensure upload directories exist
    if (!existsSync(EVENT_IMAGES_DIR)) {
      await mkdir(EVENT_IMAGES_DIR, { recursive: true });
    }
    if (!existsSync(EVENT_VIDEOS_DIR)) {
      await mkdir(EVENT_VIDEOS_DIR, { recursive: true });
    }

    const uploadedImages: Array<{ filePath: string; fileMime: string; fileName: string }> = [];
    const uploadedVideos: Array<{ filePath: string; fileMime: string; fileName: string }> = [];

    // Upload images
    for (const file of imageFiles) {
      if (!file.type.startsWith("image/")) {
        continue;
      }

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const timestamp = Date.now();
      const randomStr = Math.random().toString(36).substring(2, 15);
      const extension = file.name.split(".").pop() || "jpg";
      const fileName = `event-${eventId}-${timestamp}-${randomStr}.${extension}`;
      const filePath = join(EVENT_IMAGES_DIR, fileName);

      await writeFile(filePath, buffer);

      const relativePath = `event-images/${fileName}`;

      uploadedImages.push({
        filePath: relativePath,
        fileMime: file.type,
        fileName: file.name
      });
    }

    // Upload videos
    for (const file of videoFiles) {
      if (!file.type.startsWith("video/")) {
        continue;
      }

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const timestamp = Date.now();
      const randomStr = Math.random().toString(36).substring(2, 15);
      const extension = file.name.split(".").pop() || "mp4";
      const fileName = `event-${eventId}-${timestamp}-${randomStr}.${extension}`;
      const filePath = join(EVENT_VIDEOS_DIR, fileName);

      await writeFile(filePath, buffer);

      const relativePath = `event-videos/${fileName}`;

      uploadedVideos.push({
        filePath: relativePath,
        fileMime: file.type,
        fileName: file.name
      });
    }

    if (uploadedImages.length === 0 && uploadedVideos.length === 0) {
      return NextResponse.json({ error: "No valid images or videos uploaded" }, { status: 400 });
    }

    // Update event with new media
    const eventDoc = await EventSlot.findById(eventId);
    if (!eventDoc) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const currentImages = (eventDoc as any).images || [];
    const currentVideos = (eventDoc as any).videos || [];
    
    (eventDoc as any).images = [...currentImages, ...uploadedImages];
    (eventDoc as any).videos = [...currentVideos, ...uploadedVideos];
    
    await eventDoc.save();

    return NextResponse.json({
      data: {
        success: true,
        message: `${uploadedImages.length} image(s) and ${uploadedVideos.length} video(s) uploaded successfully`,
        images: uploadedImages,
        videos: uploadedVideos
      }
    });
  } catch (error: any) {
    console.error("[Upload Event Media API] Error:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: `Failed to upload media: ${msg}` }, { status: 500 });
  }
}

// DELETE: Remove event media
export async function DELETE(req: NextRequest) {
  try {
    const ctx = await requireAuth(req as any);
    requireRole(ctx, ["HOST"]);

    await connectMongo();

    const { searchParams } = new URL(req.url);
    const eventId = searchParams.get("eventId");
    const mediaPath = searchParams.get("mediaPath");
    const mediaType = searchParams.get("mediaType"); // "image" or "video"

    if (!eventId || !mediaPath || !mediaType) {
      return NextResponse.json({ error: "Event ID, media path, and media type required" }, { status: 400 });
    }

    // Verify host owns this event
    const event = await EventSlot.findById(eventId).lean();
    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    if (String((event as any).hostUserId) !== ctx.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const eventDoc = await EventSlot.findById(eventId);
    if (!eventDoc) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Remove from appropriate array
    if (mediaType === "image") {
      const currentImages = (eventDoc as any).images || [];
      (eventDoc as any).images = currentImages.filter((img: any) => img.filePath !== mediaPath);
    } else if (mediaType === "video") {
      const currentVideos = (eventDoc as any).videos || [];
      (eventDoc as any).videos = currentVideos.filter((vid: any) => vid.filePath !== mediaPath);
    } else {
      return NextResponse.json({ error: "Invalid media type" }, { status: 400 });
    }

    await eventDoc.save();

    return NextResponse.json({
      data: {
        success: true,
        message: "Media removed successfully"
      }
    });
  } catch (error: any) {
    console.error("[Delete Event Media API] Error:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: `Failed to delete media: ${msg}` }, { status: 500 });
  }
}
