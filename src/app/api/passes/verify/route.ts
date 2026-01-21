import { NextRequest } from "next/server";
import { requireAuth, requireRole } from "@/server/auth/rbac";
import { connectMongo } from "@/server/db/mongoose";
import { EventSlot } from "@/server/models/EventSlot";
import { getEventPassByCode, validateEventPass } from "@/server/services/eventPassService";
import { createResponse } from "@/server/http/response";
import { z } from "zod";

export const runtime = "nodejs";

const verifySchema = z.object({
  eventCode: z.string().min(1),
  eventId: z.string().min(1)
});

// Verify event code (for host check-in)
export async function POST(req: NextRequest) {
  try {
    const ctx = await requireAuth(req);
    requireRole(ctx, ["HOST"]);
    await connectMongo();

    const body = await req.json();
    const parsed = verifySchema.safeParse(body);
    if (!parsed.success) {
      return createResponse({ error: "Invalid request" }, { status: 400 });
    }

    const { eventCode, eventId } = parsed.data;

    // Verify event ownership
    const event = await EventSlot.findById(eventId).lean();
    if (!event) {
      return createResponse({ error: "Event not found" }, { status: 404 });
    }

    const eventDoc = event as any;
    if (String(eventDoc.hostUserId) !== String(ctx.userId)) {
      return createResponse({ error: "Unauthorized" }, { status: 403 });
    }

    // Get pass by code
    const pass = await getEventPassByCode(eventCode);
    if (!pass) {
      return createResponse({ 
        error: "Invalid event code",
        valid: false 
      }, { status: 400 });
    }

    // Verify pass is for this event (convert both to strings for comparison)
    if (String(pass.eventSlotId) !== String(eventId)) {
      return createResponse({ 
        error: "Event code does not match this event",
        valid: false 
      }, { status: 400 });
    }

    // Check if already validated
    if (!pass.isValid) {
      return createResponse({ 
        error: "Event pass already used",
        valid: false,
        guestName: pass.guestName,
        validatedAt: pass.validatedAt
      }, { status: 400 });
    }

    // Validate the pass
    const validated = await validateEventPass(eventCode, ctx.userId);
    if (!validated) {
      return createResponse({ error: "Failed to validate pass" }, { status: 500 });
    }

    return createResponse({
      success: true,
      valid: true,
      guestName: validated.guestName,
      eventCode: validated.eventCode,
      message: `Guest ${validated.guestName} checked in successfully!`
    });
  } catch (error: any) {
    return createResponse({ error: error.message }, { status: 401 });
  }
}
