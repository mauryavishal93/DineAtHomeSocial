import { connectMongo } from "@/server/db/mongoose";
import { EventSlot } from "@/server/models/EventSlot";
import { Booking } from "@/server/models/Booking";
import { Venue } from "@/server/models/Venue";

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
