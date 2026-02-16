import { NextRequest } from "next/server";
import { requireAuth, requireAdminAuth } from "@/server/auth/rbac";
import { cleanupEndedEventNotifications, cleanupEventNotifications } from "@/server/services/notificationCleanupService";
import { ok, serverError, badRequest } from "@/server/http/response";

export const runtime = "nodejs";

/**
 * POST /api/admin/cleanup-notifications
 * Clean up notifications for ended events and chats
 * 
 * Query params:
 * - eventId (optional): Clean up notifications for a specific event
 */
export async function POST(req: NextRequest) {
  try {
    const ctx = await requireAuth(req);
    await requireAdminAuth(req);

    const { searchParams } = new URL(req.url);
    const eventId = searchParams.get("eventId");

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
