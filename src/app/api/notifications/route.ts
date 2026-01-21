import { NextRequest } from "next/server";
import { requireAuth } from "@/server/auth/rbac";
import { connectMongo } from "@/server/db/mongoose";
import { Notification } from "@/server/models/Notification";
import { createResponse } from "@/server/http/response";

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

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    return createResponse({
      notifications: notifications.map((notif: any) => ({
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
      unreadCount: await Notification.countDocuments({ userId: ctx.userId, isRead: false })
    });
  } catch (error: any) {
    return createResponse({ error: error.message }, { status: 401 });
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
