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
  state: string;
  venueName: string;
  hostName: string;
  hostUserId: string;
  hostRating: number;
  verified: boolean;
  governmentIdPath?: string;
  foodTags: string[];
  cuisines: string[];
  activities: string[];
};

export async function listPublicEvents(filters?: {
  cities?: string[];
  localities?: string[];
  states?: string[];
  cuisines?: string[];
  interests?: string[];
  dietary?: string[];
  activities?: string[];
  minPrice?: number;
  maxPrice?: number;
  foodTag?: string;
  minRating?: number;
  dateFrom?: string;
  dateTo?: string;
}): Promise<PublicEventListItem[]> {
  try {
    await connectMongo();
  } catch (error) {
    console.error("Failed to connect to MongoDB in listPublicEvents:", error);
    // Return empty array instead of throwing to prevent 500 errors
    return [];
  }
  
  const now = new Date();
  
  // Host interest filter (check first to get host IDs) - supports multiple interests
  let hostInterestFilter: string[] = [];
  if (filters?.interests && filters.interests.length > 0) {
    // Find hosts that have ANY of the selected interests
    const interestConditions = filters.interests.map(i => ({
      interests: { $regex: i, $options: "i" }
    }));
    const hostsWithInterest = await HostProfile.find({
      $or: interestConditions
    }).select("userId").lean();
    hostInterestFilter = hostsWithInterest.map(h => String((h as any).userId));
    if (hostInterestFilter.length === 0) {
      // If interest filter is specified but no hosts match, return empty
      return [];
    }
  }
  
  // Build venue filter query - supports multiple cities, localities, states
  // Each location type uses OR (multiple cities = any city), but types are ANDed together
  const venueAndConditions: any[] = [];
  
  if (filters?.cities && filters.cities.length > 0) {
    venueAndConditions.push({
      $or: filters.cities.map(c => ({ city: { $regex: c, $options: "i" } }))
    });
  }
  if (filters?.localities && filters.localities.length > 0) {
    venueAndConditions.push({
      $or: filters.localities.map(l => ({ locality: { $regex: l, $options: "i" } }))
    });
  }
  if (filters?.states && filters.states.length > 0) {
    venueAndConditions.push({
      $or: filters.states.map(s => ({ state: { $regex: s, $options: "i" } }))
    });
  }
  
  // Find venues matching the filters
  let venueIds: any[] = [];
  if (venueAndConditions.length > 0) {
    const venueQuery = venueAndConditions.length === 1 ? venueAndConditions[0] : { $and: venueAndConditions };
    const matchingVenues = await Venue.find(venueQuery).select("_id").lean();
    venueIds = matchingVenues.map(v => (v as any)._id);
    if (venueIds.length === 0) return []; // No venues match, return empty
  }
  
  // Build event slot query
  const eventQuery: any = {
    status: "OPEN",
    endAt: { $gt: now }
  };
  if (venueIds.length > 0) {
    eventQuery.venueId = { $in: venueIds };
  }
  if (hostInterestFilter.length > 0) {
    eventQuery.hostUserId = { $in: hostInterestFilter };
  }
  
  // Price filter (convert to paise for comparison)
  if (filters?.minPrice !== undefined || filters?.maxPrice !== undefined) {
    const priceQuery: any = {};
    if (filters?.minPrice !== undefined) {
      priceQuery.$gte = filters.minPrice * 100; // Convert to paise
    }
    if (filters?.maxPrice !== undefined) {
      priceQuery.$lte = filters.maxPrice * 100; // Convert to paise
    }
    eventQuery.basePricePerGuest = priceQuery;
  }
  
  // Date range filter
  if (filters?.dateFrom) {
    eventQuery.startAt = { ...eventQuery.startAt, $gte: new Date(filters.dateFrom) };
  }
  if (filters?.dateTo) {
    eventQuery.startAt = { ...eventQuery.startAt, $lte: new Date(filters.dateTo) };
  }
  
  // Build $and array for multiple filter types (each filter type is ANDed together)
  const andConditions: any[] = [];
  
  // Cuisine filter - supports multiple cuisines (OR within category)
  // Note: We'll post-filter for both event cuisines and venue foodCategories
  // since we can't query populated fields directly in MongoDB
  // We don't add cuisine filter to query here - we'll handle it in post-filtering
  
  // Food tag filter (dietary restrictions)
  if (filters?.foodTag) {
    eventQuery.foodTags = { $regex: filters.foodTag, $options: "i" };
  }
  
  // Dietary filter - supports multiple dietary options (OR within category)
  if (filters?.dietary && filters.dietary.length > 0) {
    const dietaryConditions: any[] = [];
    filters.dietary.forEach(diet => {
      dietaryConditions.push(
        { foodTags: { $regex: diet, $options: "i" } },
        { allergenFreeKitchen: { $regex: diet, $options: "i" } },
        { certifiedLabels: { $regex: diet, $options: "i" } }
      );
    });
    andConditions.push({ $or: dietaryConditions });
  }
  
  // Activity filter - supports multiple activities (OR within category)
  // Note: We'll filter venue gamesAvailable after populating since we can't query populated fields directly
  if (filters?.activities && filters.activities.length > 0) {
    const activityConditions: any[] = [];
    filters.activities.forEach(activity => {
      activityConditions.push(
        { gamesAvailable: { $regex: activity, $options: "i" } }
      );
    });
    andConditions.push({ $or: activityConditions });
  }
  
  // Combine all conditions with $and if we have multiple filter types
  if (andConditions.length > 0) {
    if (andConditions.length === 1) {
      // Single condition, merge directly
      Object.assign(eventQuery, andConditions[0]);
    } else {
      // Multiple conditions, use $and
      eventQuery.$and = andConditions;
    }
  }
  
  // Only show upcoming events (events that haven't ended yet)
  let slots: any[] = [];
  try {
    slots = await EventSlot.find(eventQuery)
      .sort({ startAt: 1 })
      .limit(100)
      .populate({ path: "venueId", select: "name address locality city state country postalCode foodCategories gamesAvailable" })
      .lean();
  } catch (error) {
    console.error("Failed to query EventSlot in listPublicEvents:", error);
    // Return empty array instead of throwing to prevent 500 errors
    return [];
  }

  // Post-filter by venue foodCategories and gamesAvailable if needed (since we can't query populated fields directly)
  let filteredSlots = slots;
  
  // Post-filter cuisines (check both event cuisines and venue foodCategories)
  if (filters?.cuisines && filters.cuisines.length > 0) {
    filteredSlots = filteredSlots.filter((s) => {
      const venue = (s as any).venueId as any;
      const eventCuisines = ((s as any).cuisines || []).map((c: string) => c.toLowerCase().trim());
      const venueFoodCategories = (venue?.foodCategories || []).map((c: string) => c.toLowerCase().trim());
      const allCuisines = [...eventCuisines, ...venueFoodCategories];
      
      // Check if any of the filter cuisines match any of the event/venue cuisines
      // Use exact match or contains match for better results
      return filters.cuisines!.some(filterCuisine => {
        const filterLower = filterCuisine.toLowerCase().trim();
        return allCuisines.some(cuisine => {
          // Exact match or contains match
          return cuisine === filterLower || 
                 cuisine.includes(filterLower) || 
                 filterLower.includes(cuisine);
        });
      });
    });
  }
  
  // Post-filter activities (check both event gamesAvailable and venue gamesAvailable)
  if (filters?.activities && filters.activities.length > 0) {
    filteredSlots = filteredSlots.filter((s) => {
      const venue = (s as any).venueId as any;
      const eventActivities = ((s as any).gamesAvailable || []).map((a: string) => a.toLowerCase().trim());
      const venueActivities = (venue?.gamesAvailable || []).map((a: string) => a.toLowerCase().trim());
      const allActivities = [...eventActivities, ...venueActivities];
      
      // Check if any of the filter activities match any of the event/venue activities
      // Use exact match or contains match for better results
      return filters.activities!.some(filterActivity => {
        const filterLower = filterActivity.toLowerCase().trim();
        return allActivities.some(activity => {
          // Exact match or contains match
          return activity === filterLower || 
                 activity.includes(filterLower) || 
                 filterLower.includes(activity);
        });
      });
    });
  }

  const hostIds = Array.from(new Set(filteredSlots.map((s) => String((s as any).hostUserId))));
  
  // Fetch host profiles and user status
  const hostProfiles = (await HostProfile.find({ userId: { $in: hostIds } })
    .select({ userId: 1, name: 1, ratingAvg: 1, ratingCount: 1, isIdentityVerified: 1, governmentIdPath: 1 })
    .lean()) as unknown as Array<{ userId: unknown; name?: string; ratingAvg?: number; isIdentityVerified?: boolean; governmentIdPath?: string }>;
  
  // Fetch user statuses to filter out suspended hosts
  const users = await User.find({ _id: { $in: hostIds } })
    .select({ _id: 1, status: 1 })
    .lean();
  const userStatusByUserId = new Map<string, string>();
  for (const u of users) {
    userStatusByUserId.set(String((u as any)._id), (u as any).status);
  }
  
  const hostByUserId = new Map<string, { name?: string; ratingAvg?: number; isIdentityVerified?: boolean; governmentIdPath?: string; status?: string }>();
  for (const h of hostProfiles) {
    const userId = String(h.userId);
    const status = userStatusByUserId.get(userId);
    hostByUserId.set(userId, { ...h, status });
  }
  
  // Filter out events from suspended hosts
  filteredSlots = filteredSlots.filter((s) => {
    const host = hostByUserId.get(String((s as any).hostUserId));
    return host?.status !== "SUSPENDED";
  });

  // Filter by rating if specified
  if (filters?.minRating !== undefined) {
    filteredSlots = filteredSlots.filter((s) => {
      const host = hostByUserId.get(String((s as any).hostUserId));
      return (host?.ratingAvg || 0) >= filters.minRating!;
    });
  }

  try {
    return filteredSlots.map((s) => {
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
        city: venue?.city ?? "",
        locality: venue?.locality ?? "",
        state: venue?.state ?? "",
        venueName: venue?.name ?? "",
        hostName: host?.name ?? "Host",
        hostUserId: String((s as any).hostUserId),
        hostRating: host?.ratingAvg ?? 0,
        verified: host?.isIdentityVerified ?? false,
        // governmentIdPath removed from public listings for security
        foodTags: (s as any).foodTags ?? [],
        cuisines: (s as any).cuisines ?? venue?.foodCategories ?? [],
        foodType: (s as any).foodType ?? "",
        activities: (s as any).gamesAvailable ?? venue?.gamesAvailable ?? [],
        eventImages: (s as any).images ?? [],
        eventVideos: (s as any).videos ?? []
      };
    });
  } catch (error) {
    console.error("Error mapping events in listPublicEvents:", error);
    // Return empty array instead of throwing to prevent 500 errors
    return [];
  }
}

export async function getPublicEventById(eventId: string) {
  await connectMongo();
  const slot = await EventSlot.findById(eventId)
    .populate({ path: "venueId", select: "name address locality city state country postalCode foodCategories gamesAvailable images latitude longitude" })
    .lean();
  if (!slot) return null;

  const host = (await HostProfile.findOne({ userId: (slot as any).hostUserId })
    .select({ name: 1, ratingAvg: 1, isIdentityVerified: 1, governmentIdPath: 1 })
    .lean()) as { name?: string; ratingAvg?: number; isIdentityVerified?: boolean; governmentIdPath?: string } | null;
  
  // Check if host is suspended
  const hostUser = await User.findById((slot as any).hostUserId)
    .select({ status: 1 })
    .lean();
  const hostStatus = (hostUser as any)?.status || "ACTIVE";
  
  // If host is suspended, return null to prevent event access
  if (hostStatus === "SUSPENDED") {
    return null;
  }

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
    city: venue?.city ?? "",
    state: venue?.state ?? "",
    country: venue?.country ?? "",
    postalCode: venue?.postalCode ?? "",
    venueName: venue?.name ?? "",
    venueAddress: venue?.address ?? "",
    venueLatitude: venue?.latitude ?? null,
    venueLongitude: venue?.longitude ?? null,
    foodTags: (slot as any).foodTags ?? [],
    cuisines: (slot as any).cuisines ?? venue?.foodCategories ?? [],
    foodType: (slot as any).foodType ?? "",
    activities: (slot as any).gamesAvailable ?? venue?.gamesAvailable ?? [],
    hostName: host?.name ?? "Host",
    hostRating: host?.ratingAvg ?? 0,
    hostUserId: String((slot as any).hostUserId ?? ""),
    verified: host?.isIdentityVerified ?? false,
    // governmentIdPath removed from public event details for security
    status: (slot as any).status ?? "OPEN",
    cancelledAt: (slot as any).cancelledAt ? ((slot as any).cancelledAt as Date).toISOString() : null,
    cancellationReason: (slot as any).cancellationReason ?? "",
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
      status: (s as any).status ?? "OPEN", // Include status
      guests
    };
  });
}

