import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

export const runtime = "nodejs";

const UPLOAD_DIR = process.env.UPLOAD_DIR || "./uploads";

// GET: Serve uploaded images
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const imagePath = searchParams.get("path");

    if (!imagePath) {
      return NextResponse.json({ error: "Image path required" }, { status: 400 });
    }

    // Security: Prevent directory traversal
    if (imagePath.includes("..") || imagePath.startsWith("/")) {
      return NextResponse.json({ error: "Invalid image path" }, { status: 400 });
    }

    const fullPath = join(UPLOAD_DIR, imagePath);

    if (!existsSync(fullPath)) {
      return NextResponse.json({ error: "Image not found" }, { status: 404 });
    }

    const fileBuffer = await readFile(fullPath);

    // Determine content type
    let contentType = "application/octet-stream";
    const lowerPath = imagePath.toLowerCase();
    
    if (lowerPath.endsWith(".png")) {
      contentType = "image/png";
    } else if (lowerPath.endsWith(".jpg") || lowerPath.endsWith(".jpeg")) {
      contentType = "image/jpeg";
    } else if (lowerPath.endsWith(".gif")) {
      contentType = "image/gif";
    } else if (lowerPath.endsWith(".webp")) {
      contentType = "image/webp";
    } else if (lowerPath.endsWith(".mp4")) {
      contentType = "video/mp4";
    } else if (lowerPath.endsWith(".webm")) {
      contentType = "video/webm";
    } else if (lowerPath.endsWith(".mov")) {
      contentType = "video/quicktime";
    } else if (lowerPath.startsWith("event-images/") || lowerPath.startsWith("venue-images/")) {
      contentType = "image/jpeg"; // Default for image paths
    } else if (lowerPath.startsWith("event-videos/")) {
      contentType = "video/mp4"; // Default for video paths
    }

    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable"
      }
    });
  } catch (error: any) {
    console.error("[Serve Image API] Error:", error);
    return NextResponse.json({ error: "Failed to serve image" }, { status: 500 });
  }
}
