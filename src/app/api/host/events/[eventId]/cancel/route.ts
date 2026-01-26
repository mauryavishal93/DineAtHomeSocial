import { ok, badRequest, forbidden, unauthorized, serverError } from "@/server/http/response";
import { requireAuth, requireRole } from "@/server/auth/rbac";
import { cancelEventByHost } from "@/server/services/hostEventService";
import { z } from "zod";

export const runtime = "nodejs";

const cancelSchema = z.object({
  reason: z.string().min(1, "Cancellation reason is required").max(500, "Reason must be less than 500 characters")
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const ctx = await requireAuth(req as unknown as { headers: Headers });
    requireRole(ctx, ["HOST"]);

    const { eventId } = await params;
    if (!eventId) {
      return badRequest("Event ID is required");
    }

    const json = await req.json().catch(() => null);
    const parsed = cancelSchema.safeParse(json);
    if (!parsed.success) {
      return badRequest(parsed.error.errors[0]?.message || "Invalid request");
    }

    await cancelEventByHost(eventId, ctx.userId, parsed.data.reason);

    return ok({ 
      success: true, 
      message: "Event cancelled successfully. All guests have been notified." 
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to cancel event";
    const lowerMsg = msg.toLowerCase();
    
    if (lowerMsg.includes("unauthorized") || lowerMsg.includes("you can only cancel")) {
      return forbidden(msg);
    }
    if (lowerMsg.includes("missing token") || lowerMsg.includes("invalid token")) {
      return unauthorized();
    }
    if (lowerMsg.includes("already cancelled") || lowerMsg.includes("not found")) {
      return badRequest(msg);
    }
    return serverError(msg);
  }
}
