import { connectMongo } from "@/server/db/mongoose";
import { EventSlot } from "@/server/models/EventSlot";
import { Venue } from "@/server/models/Venue";
import { HostProfile } from "@/server/models/HostProfile";
import { Booking } from "@/server/models/Booking";
import { User } from "@/server/models/User";
import { GuestProfile } from "@/server/models/GuestProfile";

export type PublicEventListItem = {
  id: string;
  title: string;
  startAt: string;
  endAt: string;
  seatsLeft: number;
  maxGuests: number;
  priceFrom: number;
  city: string;
  locality: string;
  venueName: string;
  hostName: string;
  hostRating: number;
  verified: boolean;
  foodTags: string[];
  cuisines: string[];
  activities: string[];
};

export async function listPublicEvents(): Promise<PublicEventListItem[]> {
  await connectMongo();
  
  const now = new Date();
  
  // Only show upcoming events (events that haven't ended yet)
  const slots = await EventSlot.find({ 
    status: "OPEN",
    endAt: { $gt: now }
  })
    .sort({ startAt: 1 })
    .limit(100)
    .populate({ path: "venueId", select: "name address locality foodCategories gamesAvailable" })
    .lean();

  const hostIds = Array.from(new Set(slots.map((s) => String((s as any).hostUserId))));
  const hostProfiles = (await HostProfile.find({ userId: { $in: hostIds } })
    .select({ userId: 1, name: 1, ratingAvg: 1, ratingCount: 1 })
    .lean()) as unknown as Array<{ userId: unknown; name?: string; ratingAvg?: number }>;
  const hostByUserId = new Map<string, { name?: string; ratingAvg?: number }>();
  for (const h of hostProfiles) hostByUserId.set(String(h.userId), h);

  return slots.map((s) => {
    const venue = (s as any).venueId as any;
    const host = hostByUserId.get(String((s as any).hostUserId));
    return {
      id: String((s as any)._id),
      title: (s as any).eventName ?? "",
      startAt: ((s as any).startAt as Date).toISOString(),
      endAt: ((s as any).endAt as Date).toISOString(),
      seatsLeft: (s as any).seatsRemaining ?? 0,
      maxGuests: (s as any).maxGuests ?? 0,
      priceFrom: Math.round(((s as any).basePricePerGuest ?? 0) / 100),
      city: "",
      locality: venue?.locality ?? "",
      venueName: venue?.name ?? "",
      hostName: host?.name ?? "Host",
      hostRating: host?.ratingAvg ?? 0,
      verified: true,
      foodTags: (s as any).foodTags ?? [],
      cuisines: (s as any).cuisines ?? venue?.foodCategories ?? [],
      foodType: (s as any).foodType ?? "",
      activities: (s as any).gamesAvailable ?? venue?.gamesAvailable ?? [],
      eventImages: (s as any).images ?? [],
      eventVideos: (s as any).videos ?? []
    };
  });
}

export async function getPublicEventById(eventId: string) {
  await connectMongo();
  const slot = await EventSlot.findById(eventId)
    .populate({ path: "venueId", select: "name address locality foodCategories gamesAvailable images" })
    .lean();
  if (!slot) return null;

  const host = (await HostProfile.findOne({ userId: (slot as any).hostUserId })
    .select({ name: 1, ratingAvg: 1 })
    .lean()) as { name?: string; ratingAvg?: number } | null;

  const venue = (slot as any).venueId as any;
  return {
    id: String((slot as any)._id),
    title: (slot as any).eventName ?? "",
    theme: (slot as any).theme ?? "",
    startAt: ((slot as any).startAt as Date).toISOString(),
    endAt: ((slot as any).endAt as Date).toISOString(),
    seatsLeft: (slot as any).seatsRemaining ?? 0,
    maxGuests: (slot as any).maxGuests ?? 0,
    priceFrom: Math.round(((slot as any).basePricePerGuest ?? 0) / 100),
    locality: venue?.locality ?? "",
    venueName: venue?.name ?? "",
    venueAddress: venue?.address ?? "",
    foodTags: (slot as any).foodTags ?? [],
    cuisines: (slot as any).cuisines ?? venue?.foodCategories ?? [],
    foodType: (slot as any).foodType ?? "",
    activities: (slot as any).gamesAvailable ?? venue?.gamesAvailable ?? [],
    hostName: host?.name ?? "Host",
    hostRating: host?.ratingAvg ?? 0,
    hostUserId: String((slot as any).hostUserId ?? ""),
    eventImages: (slot as any).images ?? [],
    eventVideos: (slot as any).videos ?? [],
    venueImages: venue?.images ?? []
  };
}

export async function listHostEventsWithBookings(hostUserId: string) {
  await connectMongo();

  const slots = await EventSlot.find({ hostUserId })
    .sort({ startAt: -1 })
    .limit(100)
    .populate({ path: "venueId", select: "name address locality" })
    .lean();

  const slotIds = slots.map((s) => (s as any)._id);
  const bookings = await Booking.find({
    hostUserId,
    eventSlotId: { $in: slotIds },
    status: "CONFIRMED"
  })
    .sort({ createdAt: -1 })
    .populate({ path: "guestUserId", select: "email mobile" })
    .lean();

  const guestIds = Array.from(
    new Set(
      bookings.map((b) => {
        const gu = (b as any).guestUserId as any;
        return gu?._id ? String(gu._id) : String((b as any).guestUserId);
      })
    )
  );
  const guestProfiles = await GuestProfile.find({ userId: { $in: guestIds } })
    .select({ userId: 1, firstName: 1, lastName: 1, interests: 1, ratingAvg: 1, ratingCount: 1 })
    .lean();
  const gpByUserId = new Map<string, any>();
  for (const gp of guestProfiles) gpByUserId.set(String((gp as any).userId), gp);

  const bookingsBySlotId = new Map<string, any[]>();
  for (const b of bookings) {
    const key = String((b as any).eventSlotId);
    const arr = bookingsBySlotId.get(key) ?? [];
    arr.push(b);
    bookingsBySlotId.set(key, arr);
  }

  return slots.map((s) => {
    const venue = (s as any).venueId as any;
    const bs = bookingsBySlotId.get(String((s as any)._id)) ?? [];
    const guests = bs.map((b) => {
      const user = (b as any).guestUserId as any;
      const userId = user?._id ? String(user._id) : "";
      const gp = gpByUserId.get(userId);
      const name = gp ? `${gp.firstName ?? ""} ${gp.lastName ?? ""}`.trim() : user?.email ?? "";
      return {
        bookingId: String((b as any)._id),
        userId,
        name,
        mobile: user?.mobile ?? "",
        interests: gp?.interests ?? [],
        ratingAvg: gp?.ratingAvg ?? 0,
        ratingCount: gp?.ratingCount ?? 0,
        seats: (b as any).seats ?? 1
      };
    });

    return {
      id: String((s as any)._id),
      title: (s as any).eventName ?? "",
      startAt: ((s as any).startAt as Date).toISOString(),
      endAt: ((s as any).endAt as Date).toISOString(),
      seatsLeft: (s as any).seatsRemaining ?? 0,
      maxGuests: (s as any).maxGuests ?? 0,
      venueName: venue?.name ?? "",
      venueLocality: venue?.locality ?? "",
      bookingsCount: guests.length,
      guests
    };
  });
}

