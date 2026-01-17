import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/server/auth/rbac";
import { submitHostRating, submitGuestRating } from "@/server/services/feedbackService";
import { z } from "zod";

const hostRatingSchema = z.object({
  type: z.literal("HOST"),
  eventSlotId: z.string(),
  bookingId: z.string(),
  hostUserId: z.string(),
  eventRating: z.number().min(1).max(5),
  venueRating: z.number().min(1).max(5),
  foodRating: z.number().min(1).max(5),
  hospitalityRating: z.number().min(1).max(5),
  comment: z.string().optional()
});

const guestRatingSchema = z.object({
  type: z.literal("GUEST"),
  eventSlotId: z.string(),
  bookingId: z.string(),
  toGuestUserId: z.string(),
  rating: z.number().min(1).max(5),
  comment: z.string().optional()
});

const submitRatingSchema = z.discriminatedUnion("type", [
  hostRatingSchema,
  guestRatingSchema
]);

export async function POST(req: NextRequest) {
  try {
    console.log("[Submit Feedback API] Starting submission");
    const ctx = await requireAuth(req as any);
    console.log("[Submit Feedback API] User authenticated:", ctx.userId);
    
    const body = await req.json();
    console.log("[Submit Feedback API] Request body:", body);
    
    const validated = submitRatingSchema.parse(body);
    console.log("[Submit Feedback API] Validation passed, type:", validated.type);

    if (validated.type === "HOST") {
      console.log("[Submit Feedback API] Submitting host rating");
      const result = await submitHostRating({
        guestUserId: ctx.userId,
        eventSlotId: validated.eventSlotId,
        bookingId: validated.bookingId,
        hostUserId: validated.hostUserId,
        eventRating: validated.eventRating,
        venueRating: validated.venueRating,
        foodRating: validated.foodRating,
        hospitalityRating: validated.hospitalityRating,
        comment: validated.comment
      });
      console.log("[Submit Feedback API] Host rating result:", result);

      if (!result.success) {
        return NextResponse.json({ error: result.message }, { status: 400 });
      }

      return NextResponse.json({ 
        data: {
          success: true, 
          message: result.message
        }
      });
    } else {
      // GUEST rating
      console.log("[Submit Feedback API] Submitting guest rating");
      const result = await submitGuestRating({
        fromGuestUserId: ctx.userId,
        eventSlotId: validated.eventSlotId,
        bookingId: validated.bookingId,
        toGuestUserId: validated.toGuestUserId,
        rating: validated.rating,
        comment: validated.comment
      });
      console.log("[Submit Feedback API] Guest rating result:", result);

      if (!result.success) {
        return NextResponse.json({ error: result.message }, { status: 400 });
      }

      return NextResponse.json({ 
        data: {
          success: true, 
          message: result.message
        }
      });
    }
  } catch (error) {
    console.error("[Submit Feedback API] Error:", error);
    
    if (error instanceof z.ZodError) {
      console.error("[Submit Feedback API] Validation error:", error.errors);
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }
    
    const msg = error instanceof Error ? error.message : "Unauthorized";
    const stack = error instanceof Error ? error.stack : undefined;
    console.error("[Submit Feedback API] Error message:", msg);
    console.error("[Submit Feedback API] Error stack:", stack);
    
    if (msg.toLowerCase().includes("missing token") || msg.toLowerCase().includes("invalid")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    return NextResponse.json(
      { error: `Failed to submit feedback: ${msg}` },
      { status: 500 }
    );
  }
}
