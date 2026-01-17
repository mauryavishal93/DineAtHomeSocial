import { NextRequest, NextResponse } from "next/server";
import { requireAuth, requireRole } from "@/server/auth/rbac";
import { ok, badRequest, serverError } from "@/server/http/response";
import { submitHostToGuestRating, canRateGuest, getGuestRating } from "@/server/services/feedbackService";
import { Booking } from "@/server/models/Booking";
import { connectMongo } from "@/server/db/mongoose";
import { z } from "zod";

export const runtime = "nodejs";

// Schema for host-to-guest rating
const hostToGuestRatingSchema = z.object({
  eventSlotId: z.string(),
  bookingId: z.string(),
  guestUserId: z.string(),
  punctualityRating: z.number().min(1).max(5),
  appearanceRating: z.number().min(1).max(5),
  communicationRating: z.number().min(1).max(5),
  behaviorRating: z.number().min(1).max(5),
  engagementRating: z.number().min(1).max(5),
  overallPresenceRating: z.number().min(1).max(5),
  comment: z.string().optional(),
  isAdditionalGuest: z.boolean().optional(),
  guestIndex: z.number().optional()
});

// POST: Submit host rating for a guest
export async function POST(req: NextRequest) {
  try {
    console.log("[Host Rate Guest API] Starting submission");
    const ctx = await requireAuth(req as any);
    requireRole(ctx, ["HOST"]);
    console.log("[Host Rate Guest API] Host authenticated:", ctx.userId);

    const body = await req.json();
    console.log("[Host Rate Guest API] Request body:", body);

    const validated = hostToGuestRatingSchema.parse(body);
    console.log("[Host Rate Guest API] Validation passed");

    // Handle additional guests (who don't have userIds)
    if (validated.isAdditionalGuest && validated.guestIndex !== undefined) {
      await connectMongo();
      
      const booking = await Booking.findById(validated.bookingId);
      if (!booking) {
        return NextResponse.json(
          { error: "Booking not found" },
          { status: 404 }
        );
      }

      // Check if already rated
      const existingRating = (booking as any).additionalGuestRatings?.find(
        (r: any) => r.guestIndex === validated.guestIndex
      );

      if (existingRating) {
        return NextResponse.json(
          { error: "You have already rated this guest" },
          { status: 400 }
        );
      }

      // Add rating to booking
      const rating = {
        guestIndex: validated.guestIndex,
        punctualityRating: validated.punctualityRating,
        appearanceRating: validated.appearanceRating,
        communicationRating: validated.communicationRating,
        behaviorRating: validated.behaviorRating,
        engagementRating: validated.engagementRating,
        overallPresenceRating: validated.overallPresenceRating,
        comment: validated.comment || "",
        ratedBy: ctx.userId,
        ratedAt: new Date()
      };

      if (!(booking as any).additionalGuestRatings) {
        (booking as any).additionalGuestRatings = [];
      }
      (booking as any).additionalGuestRatings.push(rating);
      await booking.save();

      return NextResponse.json({
        data: {
          success: true,
          message: "Guest rating submitted successfully"
        }
      });
    }

    // Handle primary guests (who have userIds) - use existing flow
    const result = await submitHostToGuestRating({
      hostUserId: ctx.userId,
      ...validated
    });

    console.log("[Host Rate Guest API] Rating result:", result);

    if (!result.success) {
      return NextResponse.json({ data: { success: false, message: result.message } }, { status: 400 });
    }

    return NextResponse.json({
      data: {
        success: true,
        message: result.message
      }
    });
  } catch (error: any) {
    console.error("[Host Rate Guest API] Error:", error);
    
    if (error.name === "ZodError") {
      return NextResponse.json(
        { error: "Invalid rating data", details: error.errors },
        { status: 400 }
      );
    }

    const msg = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Failed to submit rating: ${msg}` },
      { status: 500 }
    );
  }
}

// GET: Check if host can rate a guest and get existing rating
export async function GET(req: NextRequest) {
  try {
    console.log("[Host Rate Guest API] Checking rating eligibility");
    const ctx = await requireAuth(req as any);
    requireRole(ctx, ["HOST"]);

    const { searchParams } = new URL(req.url);
    const eventSlotId = searchParams.get("eventSlotId");
    const guestUserId = searchParams.get("guestUserId");
    const bookingId = searchParams.get("bookingId");
    const guestIndex = searchParams.get("guestIndex");

    if (!eventSlotId || !guestUserId) {
      return NextResponse.json(
        { error: "Missing eventSlotId or guestUserId" },
        { status: 400 }
      );
    }

    console.log("[Host Rate Guest API] Checking eligibility for:", { eventSlotId, guestUserId, bookingId, guestIndex });

    // Handle additional guests (stored in booking)
    if (guestUserId.startsWith("booking:") && bookingId && guestIndex !== null) {
      await connectMongo();
      
      const booking = await Booking.findById(bookingId).lean();
      if (!booking) {
        return NextResponse.json({
          data: {
            canRate: false,
            reason: "Booking not found",
            existingRating: null
          }
        });
      }

      const index = parseInt(guestIndex);
      const existingRating = (booking as any).additionalGuestRatings?.find(
        (r: any) => r.guestIndex === index
      );

      return NextResponse.json({
        data: {
          canRate: !existingRating,
          reason: existingRating ? "You have already rated this guest" : undefined,
          existingRating: existingRating ? {
            punctualityRating: existingRating.punctualityRating,
            appearanceRating: existingRating.appearanceRating,
            communicationRating: existingRating.communicationRating,
            behaviorRating: existingRating.behaviorRating,
            engagementRating: existingRating.engagementRating,
            overallPresenceRating: existingRating.overallPresenceRating,
            comment: existingRating.comment || "",
            ratedAt: existingRating.ratedAt
          } : null
        }
      });
    }

    // Handle primary guests (with userIds) - use existing flow
    const eligibility = await canRateGuest({
      hostUserId: ctx.userId,
      eventSlotId,
      guestUserId
    });

    console.log("[Host Rate Guest API] Eligibility:", eligibility);

    // Get existing rating if any
    const existingRating = await getGuestRating({
      hostUserId: ctx.userId,
      eventSlotId,
      guestUserId
    });

    console.log("[Host Rate Guest API] Existing rating:", existingRating);

    return NextResponse.json({
      data: {
        canRate: eligibility.canRate,
        reason: eligibility.reason,
        existingRating
      }
    });
  } catch (error: any) {
    console.error("[Host Rate Guest API] Error:", error);
    
    const msg = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Failed to check rating eligibility: ${msg}` },
      { status: 500 }
    );
  }
}
