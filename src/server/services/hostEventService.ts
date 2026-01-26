import { connectMongo } from "@/server/db/mongoose";
import { EventSlot } from "@/server/models/EventSlot";
import { Booking } from "@/server/models/Booking";
import { Venue } from "@/server/models/Venue";
import { Notification } from "@/server/models/Notification";

export type HostEventWithGuests = {
  id: string;
  title: string;
  startAt: string;
  endAt: string;
  eventDate: string;
  eventTime: string;
  seatsLeft: number;
  maxGuests: number;
  venueName: string;
  venueAddress: string;
  bookingsCount: number;
  totalSeatsBooked: number;
  isPast: boolean;
  status?: string;
  guests: Array<{
    bookingId: string;
    guestUserId: string;
    guestName: string;
    guestMobile: string;
    guestAge: number;
    guestGender: string;
    seats: number;
    bookedAt: string;
    bookingStatus: string;
    isAdditionalGuest?: boolean; // true for additional guests, false/undefined for primary
    guestIndex?: number; // index in additionalGuests array (for additional guests only)
  }>;
};

export async function getHostEvents(hostUserId: string): Promise<{
  upcoming: HostEventWithGuests[];
  past: HostEventWithGuests[];
}> {
  await connectMongo();

  const events = await EventSlot.find({ hostUserId })
    .sort({ startAt: -1 })
    .populate({ path: "venueId", select: "name address" })
    .lean();

  const now = new Date();
  const upcoming: HostEventWithGuests[] = [];
  const past: HostEventWithGuests[] = [];

  for (const event of events) {
    const venue = (event as any).venueId;
    const eventStart = new Date((event as any).startAt);
    const eventEnd = new Date((event as any).endAt);
    const isPast = eventEnd < now;

    // Get bookings for this event
    const bookings = await Booking.find({
      eventSlotId: (event as any)._id,
      status: { $in: ["PAYMENT_PENDING", "CONFIRMED", "COMPLETED"] }
    })
      .sort({ createdAt: -1 })
      .lean();

    // Build guest list: primary guest + all additional guests
    const guests: any[] = [];
    
    for (const booking of bookings) {
      const b = booking as any;
      const bookingId = String(b._id);
      const additionalGuests = Array.isArray(b.additionalGuests) ? b.additionalGuests : [];
      
      // Add primary guest (the one who made the booking)
      guests.push({
        bookingId,
        guestUserId: String(b.guestUserId),
        guestName: b.guestName || "Guest",
        guestMobile: b.guestMobile || "",
        guestAge: b.guestAge || 0,
        guestGender: b.guestGender || "",
        seats: 1, // Primary guest counts as 1 seat
        bookedAt: b.createdAt,
        bookingStatus: b.status,
        isAdditionalGuest: false
      });
      
      // Add all additional guests
      for (let i = 0; i < additionalGuests.length; i++) {
        const ag = additionalGuests[i];
        guests.push({
          bookingId,
          guestUserId: "", // Additional guests don't have userIds
          guestName: ag.name || "Guest",
          guestMobile: ag.mobile || "",
          guestAge: ag.age || 0,
          guestGender: ag.gender || "",
          seats: 1, // Each additional guest counts as 1 seat
          bookedAt: b.createdAt,
          bookingStatus: b.status,
          isAdditionalGuest: true,
          guestIndex: i
        });
      }
    }

    const totalSeatsBooked = guests.reduce((sum, g) => sum + g.seats, 0);

    const item: HostEventWithGuests = {
      id: String((event as any)._id),
      title: (event as any).eventName || "Event",
      startAt: (event as any).startAt,
      endAt: (event as any).endAt,
      eventDate: eventStart.toLocaleDateString(),
      eventTime: `${eventStart.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${new Date((event as any).endAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
      seatsLeft: (event as any).seatsRemaining || 0,
      maxGuests: (event as any).maxGuests || 0,
      venueName: venue?.name || "",
      venueAddress: venue?.address || "",
      bookingsCount: bookings.length,
      totalSeatsBooked,
      isPast,
      status: (event as any).status || "OPEN", // Include status
      guests
    };

    if (isPast) {
      past.push(item);
    } else {
      upcoming.push(item);
    }
  }

  return { upcoming, past };
}

export async function cancelEventByHost(
  eventId: string,
  hostUserId: string,
  reason: string
): Promise<void> {
  await connectMongo();

  const event = await EventSlot.findById(eventId);
  if (!event) throw new Error("Event not found");

  // Verify host owns this event
  if (String((event as any).hostUserId) !== hostUserId) {
    throw new Error("Unauthorized: You can only cancel your own events");
  }

  // Check if already cancelled
  if ((event as any).status === "CANCELLED") {
    throw new Error("Event is already cancelled");
  }

  // Update event status and cancellation info
  (event as any).status = "CANCELLED";
  (event as any).cancelledAt = new Date();
  (event as any).cancellationReason = reason || "";
  await event.save();

  // Get all confirmed bookings for this event
  const bookings = await Booking.find({
    eventSlotId: eventId,
    status: { $in: ["PAYMENT_PENDING", "CONFIRMED"] }
  }).lean();

  // Cancel all bookings and update with cancellation info
  const bookingIds = bookings.map(b => (b as any)._id);
  await Booking.updateMany(
    { _id: { $in: bookingIds } },
    {
      $set: {
        status: "CANCELLED",
        cancelledAt: new Date(),
        cancellationReason: `Event cancelled by host: ${reason || "No reason provided"}`
      }
    }
  );

  // Create notifications for all guests who had bookings
  const notifications = bookings.map((booking: any) => ({
    userId: booking.guestUserId,
    title: "Event Cancelled",
    message: `The event "${(event as any).eventName}" has been cancelled by the host.${reason ? ` Reason: ${reason}` : ""}`,
    type: "EVENT_CANCELLED",
    relatedEventId: eventId,
    relatedBookingId: String(booking._id),
    isRead: false
  }));

  if (notifications.length > 0) {
    // Check for recent duplicate notifications to avoid spam
    const existingNotifications = await Notification.find({
      userId: { $in: notifications.map(n => n.userId) },
      type: "EVENT_CANCELLED",
      relatedEventId: eventId,
      createdAt: { $gte: new Date(Date.now() - 60000) } // Within last minute
    }).lean();

    const existingUserIds = new Set(
      existingNotifications.map((n: any) => String(n.userId))
    );

    const newNotifications = notifications.filter(
      n => !existingUserIds.has(String(n.userId))
    );

    if (newNotifications.length > 0) {
      await Notification.insertMany(newNotifications);
    }
  }
}
