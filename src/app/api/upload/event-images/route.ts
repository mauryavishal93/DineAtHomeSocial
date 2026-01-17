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

// POST: Upload event images
export async function POST(req: NextRequest) {
  try {
    const ctx = await requireAuth(req as any);
    requireRole(ctx, ["HOST"]);

    await connectMongo();

    const formData = await req.formData();
    const eventId = formData.get("eventId") as string;
    const files = formData.getAll("images") as File[];

    if (!eventId) {
      return NextResponse.json({ error: "Event ID required" }, { status: 400 });
    }

    if (files.length === 0) {
      return NextResponse.json({ error: "No images provided" }, { status: 400 });
    }

    // Verify host owns this event
    const event = await EventSlot.findById(eventId).lean();
    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    if (String((event as any).hostUserId) !== ctx.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Ensure upload directory exists
    if (!existsSync(EVENT_IMAGES_DIR)) {
      await mkdir(EVENT_IMAGES_DIR, { recursive: true });
    }

    const uploadedImages: Array<{ filePath: string; fileMime: string; fileName: string }> = [];

    // Upload each file
    for (const file of files) {
      if (!file.type.startsWith("image/")) {
        continue; // Skip non-image files
      }

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      // Generate unique filename
      const timestamp = Date.now();
      const randomStr = Math.random().toString(36).substring(2, 15);
      const extension = file.name.split(".").pop() || "jpg";
      const fileName = `event-${eventId}-${timestamp}-${randomStr}.${extension}`;
      const filePath = join(EVENT_IMAGES_DIR, fileName);

      // Save file
      await writeFile(filePath, buffer);

      // Relative path for storage in DB
      const relativePath = `event-images/${fileName}`;

      uploadedImages.push({
        filePath: relativePath,
        fileMime: file.type,
        fileName: file.name
      });
    }

    if (uploadedImages.length === 0) {
      return NextResponse.json({ error: "No valid images uploaded" }, { status: 400 });
    }

    // Update event with new images
    const eventDoc = await EventSlot.findById(eventId);
    if (!eventDoc) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const currentImages = (eventDoc as any).images || [];
    (eventDoc as any).images = [...currentImages, ...uploadedImages];
    await eventDoc.save();

    return NextResponse.json({
      data: {
        success: true,
        message: `${uploadedImages.length} image(s) uploaded successfully`,
        images: uploadedImages
      }
    });
  } catch (error: any) {
    console.error("[Upload Event Images API] Error:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: `Failed to upload images: ${msg}` }, { status: 500 });
  }
}

// DELETE: Remove an event image
export async function DELETE(req: NextRequest) {
  try {
    const ctx = await requireAuth(req as any);
    requireRole(ctx, ["HOST"]);

    await connectMongo();

    const { searchParams } = new URL(req.url);
    const eventId = searchParams.get("eventId");
    const imagePath = searchParams.get("imagePath");

    if (!eventId || !imagePath) {
      return NextResponse.json({ error: "Event ID and image path required" }, { status: 400 });
    }

    // Verify host owns this event
    const event = await EventSlot.findById(eventId).lean();
    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    if (String((event as any).hostUserId) !== ctx.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Remove image from array
    const eventDoc = await EventSlot.findById(eventId);
    if (!eventDoc) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const currentImages = (eventDoc as any).images || [];
    (eventDoc as any).images = currentImages.filter((img: any) => img.filePath !== imagePath);
    await eventDoc.save();

    return NextResponse.json({
      data: {
        success: true,
        message: "Image removed successfully"
      }
    });
  } catch (error: any) {
    console.error("[Delete Event Image API] Error:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: `Failed to delete image: ${msg}` }, { status: 500 });
  }
}
