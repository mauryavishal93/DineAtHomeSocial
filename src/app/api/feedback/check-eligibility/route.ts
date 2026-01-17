import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/server/auth/rbac";
import { canRateEvent, getCoGuestsForRating, getHostForRating } from "@/server/services/feedbackService";

export async function GET(req: NextRequest) {
  try {
    console.log("[Eligibility API] Starting eligibility check");
    const ctx = await requireAuth(req as any);
    console.log("[Eligibility API] User authenticated:", ctx.userId, ctx.role);
    
    const { searchParams } = new URL(req.url);
    const eventSlotId = searchParams.get("eventSlotId");
    console.log("[Eligibility API] Event ID:", eventSlotId);

    if (!eventSlotId) {
      console.error("[Eligibility API] No event ID provided");
      return NextResponse.json({ error: "Event ID required" }, { status: 400 });
    }

    // Check if user can rate
    console.log("[Eligibility API] Checking if user can rate event");
    const eligibility = await canRateEvent(ctx.userId, eventSlotId);
    console.log("[Eligibility API] Eligibility result:", eligibility);
    
    if (!eligibility.canRate) {
      console.log("[Eligibility API] User cannot rate:", eligibility.reason);
      return NextResponse.json({ 
        data: {
          canRate: false, 
          reason: eligibility.reason 
        }
      });
    }

    // Get host and co-guests for rating
    console.log("[Eligibility API] Fetching host and co-guests");
    const [host, coGuests] = await Promise.all([
      getHostForRating(ctx.userId, eventSlotId),
      getCoGuestsForRating(ctx.userId, eventSlotId)
    ]);
    console.log("[Eligibility API] Host:", host);
    console.log("[Eligibility API] Co-guests count:", coGuests.length);

    return NextResponse.json({
      data: {
        canRate: true,
        bookingId: eligibility.bookingId,
        host,
        coGuests
      }
    });
  } catch (error) {
    console.error("[Eligibility API] Error:", error);
    const msg = error instanceof Error ? error.message : "Unauthorized";
    const stack = error instanceof Error ? error.stack : undefined;
    console.error("[Eligibility API] Error message:", msg);
    console.error("[Eligibility API] Error stack:", stack);
    
    if (msg.toLowerCase().includes("missing token") || msg.toLowerCase().includes("invalid")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: `Failed to check eligibility: ${msg}` },
      { status: 500 }
    );
  }
}
