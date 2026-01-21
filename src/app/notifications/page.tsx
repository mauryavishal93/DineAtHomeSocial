"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/http";
import { getAccessToken } from "@/lib/session";

type NotificationItem = {
  id: string;
  type: string;
  title: string;
  message: string;
  relatedEventId: string | null;
  relatedBookingId: string | null;
  relatedUserId: string | null;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
  metadata: any;
};

export default function NotificationsPage() {
  const router = useRouter();
  const token = getAccessToken();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"ALL" | "UNREAD">("ALL");

  useEffect(() => {
    if (!token) {
      router.push("/auth/login");
      return;
    }

    loadNotifications();
    
    // Poll for new notifications every 10 seconds
    const interval = setInterval(loadNotifications, 10000);
    return () => clearInterval(interval);
  }, [token, router, filter]);

  const loadNotifications = async () => {
    if (!token) return;
    
    const url = filter === "UNREAD" ? "/api/notifications?unreadOnly=true" : "/api/notifications";
    const res = await apiFetch<{ notifications: NotificationItem[]; unreadCount: number }>(url, {
      headers: { authorization: `Bearer ${token}` }
    });
    
    if (res.ok && res.data) {
      setNotifications(res.data.notifications);
      setUnreadCount(res.data.unreadCount);
    }
    setLoading(false);
  };

  const markAsRead = async (id: string) => {
    if (!token) return;
    
    const res = await apiFetch("/api/notifications", {
      method: "PATCH",
      headers: {
        authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ notificationId: id })
    });
    
    if (res.ok) {
      loadNotifications();
    }
  };

  const markAllAsRead = async () => {
    if (!token) return;
    
    const res = await apiFetch("/api/notifications", {
      method: "PATCH",
      headers: {
        authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ markAllAsRead: true })
    });
    
    if (res.ok) {
      loadNotifications();
    }
  };

  const handleNotificationClick = (notif: NotificationItem) => {
    // Mark as read if unread
    if (!notif.isRead) {
      markAsRead(notif.id);
    }
    
    // Navigate to event if available
    if (notif.metadata?.eventId) {
      router.push(`/events/${notif.metadata.eventId}`);
    } else if (notif.relatedEventId) {
      router.push(`/events/${notif.relatedEventId}`);
    }
  };

  const getNotificationIcon = (type: string) => {
    const icons: Record<string, string> = {
      BOOKING: "🎫",
      BOOKING_CONFIRMED: "✅",
      BOOKING_CANCELLED: "❌",
      EVENT_REMINDER: "⏰",
      NEW_MESSAGE: "💬",
      EVENT_APPROVED: "✨",
      EVENT_REJECTED: "⚠️",
      PAYMENT_RECEIVED: "💰",
      GUEST_RATED: "⭐",
      HOST_RATED: "⭐",
      EVENT_FULL: "🔒",
      SEAT_AVAILABLE: "🎉",
      EVENT_CANCELLED: "🚫"
    };
    return icons[type] || "🔔";
  };

  const getNotificationColor = (type: string) => {
    if (type.includes("CONFIRMED") || type.includes("APPROVED") || type.includes("RECEIVED")) {
      return "success";
    }
    if (type.includes("CANCELLED") || type.includes("REJECTED")) {
      return "warning";
    }
    return "violet";
  };

  if (loading) {
    return (
      <main className="py-10">
        <Container>
          <div className="text-center text-ink-700">Loading notifications...</div>
        </Container>
      </main>
    );
  }

  return (
    <main className="py-10">
      <Container>
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="font-display text-4xl tracking-tight bg-gradient-to-r from-violet-600 via-pink-600 to-orange-500 bg-clip-text text-transparent">
              Notifications
            </h1>
            <p className="mt-2 text-ink-700">
              {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? "s" : ""}` : "All caught up!"}
            </p>
          </div>
          {unreadCount > 0 && (
            <Button variant="outline" onClick={markAllAsRead}>
              Mark all as read
            </Button>
          )}
        </div>

        <div className="mb-6 flex flex-wrap gap-2">
          <Button
            variant={filter === "ALL" ? "primary" : "outline"}
            size="sm"
            onClick={() => setFilter("ALL")}
          >
            All ({notifications.length})
          </Button>
          <Button
            variant={filter === "UNREAD" ? "primary" : "outline"}
            size="sm"
            onClick={() => setFilter("UNREAD")}
          >
            Unread ({unreadCount})
          </Button>
        </div>

        {notifications.length === 0 ? (
          <div className="rounded-3xl border-2 border-violet-200 bg-gradient-to-br from-white via-pink-50/30 to-violet-50/30 p-12 text-center shadow-colorful">
            <div className="text-6xl mb-4">🔔</div>
            <h2 className="font-display text-2xl text-ink-900 mb-2">No notifications</h2>
            <p className="text-ink-700">You're all caught up! Check back later for updates.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {notifications.map((notif) => (
              <div
                key={notif.id}
                onClick={() => handleNotificationClick(notif)}
                className={`rounded-3xl border-2 p-6 shadow-lg transition-all duration-300 hover:shadow-colorful cursor-pointer hover:scale-[1.01] ${
                  notif.isRead
                    ? "border-violet-200 bg-gradient-to-br from-white via-pink-50/20 to-violet-50/20 opacity-75"
                    : "border-violet-300 bg-gradient-to-br from-white via-pink-50/40 to-violet-50/40"
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className="text-4xl">{getNotificationIcon(notif.type)}</div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-display text-lg text-ink-900">{notif.title}</h3>
                        <Badge tone={getNotificationColor(notif.type) as any} className="mt-1">
                          {notif.type.replace(/_/g, " ")}
                        </Badge>
                      </div>
                      {!notif.isRead && (
                        <button
                          onClick={() => markAsRead(notif.id)}
                          className="text-violet-600 hover:text-violet-800 text-sm font-medium"
                        >
                          Mark as read
                        </button>
                      )}
                    </div>
                    <p className="text-ink-700 mb-3">{notif.message}</p>
                    <div className="flex items-center gap-3">
                      {notif.relatedEventId && (
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/events/${notif.relatedEventId}`}>View Event</Link>
                        </Button>
                      )}
                      {notif.relatedBookingId && (
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/bookings`}>View Booking</Link>
                        </Button>
                      )}
                      <span className="text-xs text-ink-500">
                        {new Date(notif.createdAt).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Container>
    </main>
  );
}
