import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";
import { requireAuth, requireRole } from "@/server/auth/rbac";
import { connectMongo } from "@/server/db/mongoose";
import { Venue } from "@/server/models/Venue";
import { HostProfile } from "@/server/models/HostProfile";
import { serverError, unauthorized, badRequest } from "@/server/http/response";

export const runtime = "nodejs";

const UPLOAD_DIR = process.env.UPLOAD_DIR || "./uploads";
const VENUE_IMAGES_DIR = join(UPLOAD_DIR, "venue-images");

// POST: Upload venue images
export async function POST(req: NextRequest) {
  try {
    const ctx = await requireAuth(req as any);
    requireRole(ctx, ["HOST"]);

    await connectMongo();

    // Get host's venue
    const hostProfile = await HostProfile.findOne({ userId: ctx.userId }).lean();
    if (!hostProfile || !(hostProfile as any).venueId) {
      return NextResponse.json({ error: "Venue not found" }, { status: 404 });
    }

    const venueId = (hostProfile as any).venueId;

    // Parse form data
    const formData = await req.formData();
    const files = formData.getAll("images") as File[];

    if (files.length === 0) {
      return NextResponse.json({ error: "No images provided" }, { status: 400 });
    }

    // Ensure upload directory exists
    if (!existsSync(VENUE_IMAGES_DIR)) {
      await mkdir(VENUE_IMAGES_DIR, { recursive: true });
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
      const fileName = `venue-${venueId}-${timestamp}-${randomStr}.${extension}`;
      const filePath = join(VENUE_IMAGES_DIR, fileName);

      // Save file
      await writeFile(filePath, buffer);

      // Relative path for storage in DB
      const relativePath = `venue-images/${fileName}`;

      uploadedImages.push({
        filePath: relativePath,
        fileMime: file.type,
        fileName: file.name
      });
    }

    if (uploadedImages.length === 0) {
      return NextResponse.json({ error: "No valid images uploaded" }, { status: 400 });
    }

    // Update venue with new images
    const venue = await Venue.findById(venueId);
    if (!venue) {
      return NextResponse.json({ error: "Venue not found" }, { status: 404 });
    }

    const currentImages = (venue as any).images || [];
    (venue as any).images = [...currentImages, ...uploadedImages];
    await venue.save();

    return NextResponse.json({
      data: {
        success: true,
        message: `${uploadedImages.length} image(s) uploaded successfully`,
        images: uploadedImages
      }
    });
  } catch (error: any) {
    console.error("[Upload Venue Images API] Error:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: `Failed to upload images: ${msg}` }, { status: 500 });
  }
}

// DELETE: Remove a venue image
export async function DELETE(req: NextRequest) {
  try {
    const ctx = await requireAuth(req as any);
    requireRole(ctx, ["HOST"]);

    await connectMongo();

    const { searchParams } = new URL(req.url);
    const imagePath = searchParams.get("imagePath");

    if (!imagePath) {
      return NextResponse.json({ error: "Image path required" }, { status: 400 });
    }

    // Get host's venue
    const hostProfile = await HostProfile.findOne({ userId: ctx.userId }).lean();
    if (!hostProfile || !(hostProfile as any).venueId) {
      return NextResponse.json({ error: "Venue not found" }, { status: 404 });
    }

    const venueId = (hostProfile as any).venueId;
    const venue = await Venue.findById(venueId);
    if (!venue) {
      return NextResponse.json({ error: "Venue not found" }, { status: 404 });
    }

    // Remove image from array
    const currentImages = (venue as any).images || [];
    (venue as any).images = currentImages.filter((img: any) => img.filePath !== imagePath);
    await venue.save();

    return NextResponse.json({
      data: {
        success: true,
        message: "Image removed successfully"
      }
    });
  } catch (error: any) {
    console.error("[Delete Venue Image API] Error:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: `Failed to delete image: ${msg}` }, { status: 500 });
  }
}
