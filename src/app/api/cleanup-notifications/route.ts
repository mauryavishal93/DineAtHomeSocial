import { NextRequest } from "next/server";
import { cleanupEndedEventNotifications, cleanupEventNotifications } from "@/server/services/notificationCleanupService";
import { ok, serverError, badRequest } from "@/server/http/response";

export const runtime = "nodejs";

/**
 * POST /api/cleanup-notifications
 * Public endpoint to clean up notifications for ended events and chats
 * Can be called by external cron services or scheduled tasks
 * 
 * Query params:
 * - eventId (optional): Clean up notifications for a specific event
 * - secret (required): Secret key to prevent unauthorized access
 */
export async function POST(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const eventId = searchParams.get("eventId");
    const secret = searchParams.get("secret");

    // Simple secret check (you can use a more secure method)
    const expectedSecret = process.env.CLEANUP_SECRET || "cleanup-secret-change-me";
    if (secret !== expectedSecret) {
      return badRequest("Unauthorized: Invalid secret");
    }

    if (eventId) {
      // Clean up notifications for a specific event
      const deletedCount = await cleanupEventNotifications(eventId);
      return ok({
        success: true,
        deletedCount,
        message: `Cleaned up ${deletedCount} notifications for event ${eventId}`
      });
    } else {
      // Clean up all notifications for ended events
      const result = await cleanupEndedEventNotifications();
      return ok({
        success: true,
        deletedCount: result.deletedCount,
        eventsProcessed: result.eventsProcessed,
        message: `Cleaned up ${result.deletedCount} notifications for ${result.eventsProcessed} ended events`
      });
    }
  } catch (error: any) {
    if (error.message === "Event not found") {
      return badRequest(error.message);
    }
    return serverError(error.message || "Failed to cleanup notifications");
  }
}
