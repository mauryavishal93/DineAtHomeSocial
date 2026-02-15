import { connectMongo } from "@/server/db/mongoose";
import { Notification } from "@/server/models/Notification";
import { EventSlot } from "@/server/models/EventSlot";
import { Types } from "mongoose";

/**
 * Clean up notifications for events and chats that have ended
 * Deletes notifications related to:
 * - Events that have ended (endAt < now)
 * - Chat messages (NEW_MESSAGE type) for events that have ended
 */
export async function cleanupEndedEventNotifications(): Promise<{
  deletedCount: number;
  eventsProcessed: number;
}> {
  await connectMongo();

  const now = new Date();
  
  // Find all events that have ended
  const endedEvents = await EventSlot.find({
    endAt: { $lt: now }
  })
    .select("_id endAt eventName")
    .lean();

  const eventIds = endedEvents.map((e: any) => e._id);
  
  if (eventIds.length === 0) {
    return { deletedCount: 0, eventsProcessed: 0 };
  }

  // Convert to ObjectIds for query
  const eventObjectIds = eventIds.map((id: any) => 
    id instanceof Types.ObjectId ? id : new Types.ObjectId(String(id))
  );

  // Delete all notifications related to these ended events
  // This includes:
  // - Event-related notifications (EVENT_REMINDER, EVENT_CANCELLED, etc.)
  // - Chat notifications (NEW_MESSAGE) for these events
  // - Any other notification with relatedEventId pointing to ended events
  const result = await Notification.deleteMany({
    relatedEventId: { $in: eventObjectIds }
  });

  return {
    deletedCount: result.deletedCount || 0,
    eventsProcessed: eventIds.length
  };
}

/**
 * Clean up notifications for a specific event
 * Useful when an event ends and we want to immediately clean up
 */
export async function cleanupEventNotifications(eventId: string): Promise<number> {
  await connectMongo();

  // Verify event has ended
  const event = await EventSlot.findById(eventId).lean();
  if (!event) {
    throw new Error("Event not found");
  }

  const eventDoc = event as any;
  const eventEndTime = eventDoc.endAt ? new Date(eventDoc.endAt) : null;
  const now = new Date();

  if (!eventEndTime || eventEndTime >= now) {
    // Event hasn't ended yet, don't delete notifications
    return 0;
  }

  // Delete all notifications related to this event
  const result = await Notification.deleteMany({
    relatedEventId: eventId
  });

  return result.deletedCount || 0;
}
