import { NextRequest } from "next/server";
import { requireAuth } from "@/server/auth/rbac";
import { connectMongo } from "@/server/db/mongoose";
import { Notification } from "@/server/models/Notification";
import { EventSlot } from "@/server/models/EventSlot";
import { createResponse } from "@/server/http/response";
import { Types } from "mongoose";

// Get notifications
export async function GET(req: NextRequest) {
  try {
    const ctx = await requireAuth(req);
    await connectMongo();

    const url = new URL(req.url);
    const unreadOnly = url.searchParams.get("unreadOnly") === "true";
    const limit = parseInt(url.searchParams.get("limit") || "50");

    const query: any = { userId: ctx.userId };
    if (unreadOnly) {
      query.isRead = false;
    }

    // Get notifications
    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    // Filter out notifications for ended events (background cleanup)
    const now = new Date();
    const validNotifications: any[] = [];
    const notificationsToDelete: string[] = [];
    const endedEventIds = new Set<string>();

    try {
      // Get unique event IDs from notifications (as strings)
      const eventIdStrings = notifications
        .map((n: any) => n.relatedEventId)
        .filter(Boolean)
        .map((id: any) => String(id));
      
      const uniqueEventIds = [...new Set(eventIdStrings)];

      if (uniqueEventIds.length > 0) {
        // Convert to ObjectIds for MongoDB query
        const eventObjectIds = uniqueEventIds
          .map((id: string) => {
            try {
              return new Types.ObjectId(id);
            } catch {
              return null;
            }
          })
          .filter(Boolean) as Types.ObjectId[];

        if (eventObjectIds.length > 0) {
          // Find which events have ended
          const endedEvents = await EventSlot.find({
            _id: { $in: eventObjectIds },
            endAt: { $lt: now }
          })
            .select("_id")
            .lean();

          endedEvents.forEach((e: any) => {
            endedEventIds.add(String(e._id));
          });

          // Filter notifications
          for (const notif of notifications) {
            const eventId = notif.relatedEventId ? String(notif.relatedEventId) : null;
            
            if (eventId && endedEventIds.has(eventId)) {
              // Mark for deletion
              notificationsToDelete.push(String(notif._id));
            } else {
              // Keep this notification
              validNotifications.push(notif);
            }
          }

          // Delete notifications for ended events (background cleanup - don't await)
          if (notificationsToDelete.length > 0) {
            Notification.deleteMany({ _id: { $in: notificationsToDelete } })
              .catch((err) => console.error("Failed to delete ended event notifications:", err));
          }
        } else {
          // No valid ObjectIds, return all notifications
          validNotifications.push(...notifications);
        }
      } else {
        // No event-related notifications, return all
        validNotifications.push(...notifications);
      }
    } catch (cleanupError) {
      // If cleanup fails, just return all notifications - don't break the API
      console.error("Error during notification cleanup:", cleanupError);
      // Fallback: return all notifications without filtering
      if (validNotifications.length === 0) {
        validNotifications.push(...notifications);
      }
    }

    const filteredNotifications = validNotifications;

    // Calculate unread count - query database but exclude notifications for ended events
    let unreadCount = 0;
    try {
      if (endedEventIds.size > 0) {
        // Get all unread notifications and filter out ended events
        const unreadQuery: any = { userId: ctx.userId, isRead: false };
        const allUnread = await Notification.find(unreadQuery).select("relatedEventId").lean();
        
        unreadCount = allUnread.filter((n: any) => {
          const eventId = n.relatedEventId ? String(n.relatedEventId) : null;
          return !eventId || !endedEventIds.has(eventId);
        }).length;
      } else {
        // No ended events, just count all unread
        unreadCount = await Notification.countDocuments({ userId: ctx.userId, isRead: false });
      }
    } catch (countError) {
      // If count query fails, calculate from filtered notifications
      console.error("Error calculating unread count:", countError);
      unreadCount = filteredNotifications.filter((n: any) => !n.isRead).length;
    }

    return createResponse({
      notifications: filteredNotifications.map((notif: any) => ({
        id: String(notif._id),
        type: notif.type,
        title: notif.title,
        message: notif.message,
        relatedEventId: notif.relatedEventId ? String(notif.relatedEventId) : null,
        relatedBookingId: notif.relatedBookingId ? String(notif.relatedBookingId) : null,
        relatedUserId: notif.relatedUserId ? String(notif.relatedUserId) : null,
        isRead: notif.isRead,
        readAt: notif.readAt,
        createdAt: notif.createdAt,
        metadata: notif.metadata || {}
      })),
      unreadCount
    });
  } catch (error: any) {
    console.error("Notifications API error:", error);
    const msg = error instanceof Error ? error.message : "Failed to load notifications";
    // Return 500 for server errors, 401 for auth errors
    const status = msg.toLowerCase().includes("unauthorized") || msg.toLowerCase().includes("token") ? 401 : 500;
    return createResponse({ error: msg }, { status });
  }
}

// Mark as read
export async function PATCH(req: NextRequest) {
  try {
    const ctx = await requireAuth(req);
    await connectMongo();

    const body = await req.json();
    const { notificationId, markAllAsRead } = body;

    if (markAllAsRead) {
      await Notification.updateMany(
        { userId: ctx.userId, isRead: false },
        { isRead: true, readAt: new Date() }
      );
      return createResponse({ success: true });
    }

    if (!notificationId) {
      return createResponse({ error: "notificationId is required" }, { status: 400 });
    }

    await Notification.updateOne(
      { _id: notificationId, userId: ctx.userId },
      { isRead: true, readAt: new Date() }
    );

    return createResponse({ success: true });
  } catch (error: any) {
    return createResponse({ error: error.message }, { status: 401 });
  }
}

// Delete notification
export async function DELETE(req: NextRequest) {
  try {
    const ctx = await requireAuth(req);
    await connectMongo();

    const url = new URL(req.url);
    const notificationId = url.searchParams.get("id");

    if (!notificationId) {
      return createResponse({ error: "notificationId is required" }, { status: 400 });
    }

    await Notification.deleteOne({ _id: notificationId, userId: ctx.userId });

    return createResponse({ success: true });
  } catch (error: any) {
    return createResponse({ error: error.message }, { status: 401 });
  }
}
