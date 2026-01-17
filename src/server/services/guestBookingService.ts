import { connectMongo } from "@/server/db/mongoose";
import { Booking } from "@/server/models/Booking";
import { EventSlot } from "@/server/models/EventSlot";
import { Venue } from "@/server/models/Venue";
import { User } from "@/server/models/User";

export type GuestBookingListItem = {
  bookingId: string;
  eventSlotId: string;
  eventName: string;
  eventDate: string;
  eventTime: string;
  startAt: string;
  endAt: string;
  venueName: string;
  venueAddress: string;
  hostName: string;
  hostMobile: string;
  seats: number;
  amountPaid: number;
  bookingStatus: string;
  bookedAt: string;
  isPast: boolean;
};

export async function getGuestBookings(guestUserId: string): Promise<{
  upcoming: GuestBookingListItem[];
  past: GuestBookingListItem[];
}> {
  await connectMongo();

  const bookings = await Booking.find({
    guestUserId,
    status: { $in: ["PAYMENT_PENDING", "CONFIRMED", "COMPLETED"] }
  })
    .sort({ createdAt: -1 })
    .populate({ path: "eventSlotId", select: "eventName startAt endAt venueId hostUserId" })
    .populate({ path: "venueId", select: "name address" })
    .lean();

  const now = new Date();
  const upcoming: GuestBookingListItem[] = [];
  const past: GuestBookingListItem[] = [];

  for (const booking of bookings) {
    const event = (booking as any).eventSlotId;
    const venue = (booking as any).venueId;
    
    if (!event || !venue) continue;

    const eventStart = new Date(event.startAt);
    const eventEnd = new Date(event.endAt);
    const isPast = eventEnd < now;

    // Get host details
    const host = await User.findById(event.hostUserId).lean();
    const hostName = (host as any)?.name || "Host";
    const hostMobile = (host as any)?.mobile || "";

    const item: GuestBookingListItem = {
      bookingId: String((booking as any)._id),
      eventSlotId: String(event._id),
      eventName: event.eventName || "Event",
      eventDate: new Date(event.startAt).toLocaleDateString(),
      eventTime: `${new Date(event.startAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${new Date(event.endAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
      startAt: event.startAt,
      endAt: event.endAt,
      venueName: venue.name || "",
      venueAddress: venue.address || "",
      hostName,
      hostMobile,
      seats: (booking as any).seats || 1,
      amountPaid: (booking as any).amountTotal || 0,
      bookingStatus: (booking as any).status,
      bookedAt: (booking as any).createdAt,
      isPast
    };

    if (isPast) {
      past.push(item);
    } else {
      upcoming.push(item);
    }
  }

  return { upcoming, past };
}
