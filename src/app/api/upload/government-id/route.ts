import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";
import { requireAuth, requireRole } from "@/server/auth/rbac";
import { connectMongo } from "@/server/db/mongoose";
import { HostProfile } from "@/server/models/HostProfile";
import { serverError } from "@/server/http/response";

export const runtime = "nodejs";

const UPLOAD_DIR = process.env.UPLOAD_DIR || "./uploads";
const GOVERNMENT_ID_DIR = join(UPLOAD_DIR, "government-ids");

// POST: Upload government ID document
export async function POST(req: NextRequest) {
  try {
    const ctx = await requireAuth(req as any);
    requireRole(ctx, ["HOST"]);

    await connectMongo();

    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file type (only images and PDFs)
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp", "application/pdf"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Only images (JPEG, PNG, WebP) and PDFs are allowed." },
        { status: 400 }
      );
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return NextResponse.json({ error: "File size exceeds 5MB limit" }, { status: 400 });
    }

    // Ensure upload directory exists
    if (!existsSync(GOVERNMENT_ID_DIR)) {
      await mkdir(GOVERNMENT_ID_DIR, { recursive: true });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 15);
    const extension = file.name.split(".").pop() || (file.type === "application/pdf" ? "pdf" : "jpg");
    const fileName = `gov-id-${ctx.userId}-${timestamp}-${randomStr}.${extension}`;
    const filePath = join(GOVERNMENT_ID_DIR, fileName);

    await writeFile(filePath, buffer);

    const relativePath = `government-ids/${fileName}`;

    // Update host profile with government ID path
    await HostProfile.findOneAndUpdate(
      { userId: ctx.userId },
      { 
        $set: { 
          governmentIdPath: relativePath,
          isIdentityVerified: false // Reset verification status when new ID is uploaded
        } 
      }
    );

    return NextResponse.json({
      filePath: relativePath,
      fileMime: file.type,
      fileName: file.name
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to upload government ID";
    return serverError(msg);
  }
}
