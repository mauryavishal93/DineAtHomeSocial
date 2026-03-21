import { NextRequest } from "next/server";
import { requireAuth } from "@/server/auth/rbac";
import { connectMongo } from "@/server/db/mongoose";
import { EventSlot } from "@/server/models/EventSlot";
import { Booking } from "@/server/models/Booking";
import { Notification } from "@/server/models/Notification";
import { User } from "@/server/models/User";
import { createResponse } from "@/server/http/response";
import { sendEmail } from "@/server/services/emailService";

// Send reminder for an event
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const ctx = await requireAuth(req);
    await connectMongo();
    const { eventId } = await params;

    const body = await req.json();
    const { reminderType } = body; // "24_HOURS", "2_HOURS", "CUSTOM"

    const event = await EventSlot.findById(eventId).lean();
    if (!event) {
      return createResponse({ error: "Event not found" }, { status: 404 });
    }

    const eventDoc = event as any;
    const isHost = String(eventDoc.hostUserId) === String(ctx.userId);

    if (!isHost) {
      return createResponse({ error: "Only hosts can send reminders" }, { status: 403 });
    }

    const eventStart = new Date(eventDoc.startAt);
    const now = new Date();

    // Get all confirmed bookings
    const bookings = await Booking.find({
      eventSlotId: eventId,
      status: { $in: ["CONFIRMED", "PAYMENT_PENDING"] }
    }).lean();

    let reminderTime: Date;
    let reminderMessage: string;

    switch (reminderType) {
      case "24_HOURS":
        reminderTime = new Date(eventStart.getTime() - 24 * 60 * 60 * 1000);
        reminderMessage = `Reminder: "${eventDoc.eventName}" is tomorrow at ${eventStart.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
        break;
      case "2_HOURS":
        reminderTime = new Date(eventStart.getTime() - 2 * 60 * 60 * 1000);
        reminderMessage = `Reminder: "${eventDoc.eventName}" starts in 2 hours!`;
        break;
      default:
        reminderTime = now;
        reminderMessage = `Reminder: "${eventDoc.eventName}" is coming up soon!`;
    }

    // Create notifications for all guests
    const notifications = bookings.map((booking: any) => ({
      userId: booking.guestUserId,
      type: "EVENT_REMINDER",
      title: "Event Reminder",
      message: reminderMessage,
      relatedEventId: eventId,
      metadata: {
        eventName: eventDoc.eventName,
        eventStart: eventDoc.startAt,
        reminderType
      }
    }));

    await Notification.insertMany(notifications);

    // Send email reminders (best-effort; do not fail the API if sending fails)
    try {
      const guestIds = bookings.map((b: any) => String(b.guestUserId));
      const users = await User.find({ _id: { $in: guestIds } }).select({ _id: 1, email: 1 }).lean();
      const emailById = new Map<string, string>();
      for (const u of users as any[]) {
        emailById.set(String(u._id), String(u.email));
      }

      const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      const when = `${eventStart.toLocaleDateString()} at ${eventStart.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
      const html = (guestEmail: string) => `
        <div style="font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial; line-height: 1.5;">
          <h2 style="margin:0 0 8px;">Event reminder</h2>
          <p style="margin:0 0 12px;">${reminderMessage}</p>
          <p style="margin:0 0 12px;"><strong>When:</strong> ${when}</p>
          <p style="margin:0 0 12px;"><strong>Event:</strong> ${eventDoc.eventName}</p>
          <p style="margin:0 0 16px;">
            <a href="${appUrl}/events/${eventId}" style="color:#7c3aed;">View event details</a>
          </p>
          <p style="margin:0; color:#6b7280; font-size:12px;">You received this because you have a booking for this event.</p>
        </div>
      `.trim();

      await Promise.all(
        bookings.map(async (booking: any) => {
          const guestEmail = emailById.get(String(booking.guestUserId));
          if (!guestEmail) return;
          await sendEmail({
            to: guestEmail,
            subject: `Reminder: ${eventDoc.eventName}`,
            html: html(guestEmail)
          });
        })
      );
    } catch (e) {
      console.error("[Reminders] Email reminder send failed:", e);
    }

    return createResponse({
      success: true,
      message: `Reminders sent to ${bookings.length} guests`,
      sentCount: bookings.length
    });
  } catch (error: any) {
    return createResponse({ error: error.message }, { status: 401 });
  }
}

// Get reminder settings/status
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const ctx = await requireAuth(req);
    await connectMongo();
    const { eventId } = await params;

    const event = await EventSlot.findById(eventId).lean();
    if (!event) {
      return createResponse({ error: "Event not found" }, { status: 404 });
    }

    const eventDoc = event as any;
    const eventStart = new Date(eventDoc.startAt);
    const now = new Date();

    const hoursUntilEvent = (eventStart.getTime() - now.getTime()) / (1000 * 60 * 60);

    return createResponse({
      eventId,
      eventStart: eventDoc.startAt,
      hoursUntilEvent: Math.round(hoursUntilEvent * 10) / 10,
      canSend24HourReminder: hoursUntilEvent <= 24 && hoursUntilEvent > 2,
      canSend2HourReminder: hoursUntilEvent <= 2 && hoursUntilEvent > 0,
      autoRemindersEnabled: true // TODO: Add to event settings
    });
  } catch (error: any) {
    return createResponse({ error: error.message }, { status: 401 });
  }
}
