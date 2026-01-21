import { NextRequest } from "next/server";
import { requireAuth } from "@/server/auth/rbac";
import { connectMongo } from "@/server/db/mongoose";
import { EventSlot } from "@/server/models/EventSlot";
import { Booking } from "@/server/models/Booking";
import { Notification } from "@/server/models/Notification";
import { createResponse } from "@/server/http/response";

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

    // TODO: Send email/SMS reminders
    // await sendEmailReminders(bookings, eventDoc, reminderMessage);
    // await sendSMSReminders(bookings, eventDoc, reminderMessage);

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
