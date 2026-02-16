import { connectMongo } from "@/server/db/mongoose";
import { EventPass } from "@/server/models/EventPass";
import { EventSlot } from "@/server/models/EventSlot";
import { Booking } from "@/server/models/Booking";
import { User } from "@/server/models/User";
import { Venue } from "@/server/models/Venue";
import { HostProfile } from "@/server/models/HostProfile";

/**
 * Generate a unique event code
 * Format: EVT-XXXXXX-YYYYYY (6 chars + 6 chars)
 */
function generateEventCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Exclude confusing chars
  const part1 = Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  const part2 = Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  return `EVT-${part1}-${part2}`;
}

/**
 * Create event pass for a booking (single pass with all guests)
 */
export async function createEventPasses(bookingId: string) {
  await connectMongo();
  
  const booking = await Booking.findById(bookingId);
  if (!booking) {
    throw new Error("Booking not found");
  }
  
  const bookingDoc = booking as any;
  
  // Check if pass already exists (only one pass per booking)
  const existingPass = await EventPass.findOne({ bookingId }).lean();
  if (existingPass) {
    return [String((existingPass as any)._id)];
  }
  
  // Generate unique code for the booking pass
  let eventCode = generateEventCode();
  let codeExists = await EventPass.findOne({ eventCode }).lean();
  while (codeExists) {
    eventCode = generateEventCode();
    codeExists = await EventPass.findOne({ eventCode }).lean();
  }
  
  // Create single pass for the booking with primary guest details
  // (additional guests will be shown from booking data when pass is retrieved)
  const pass = await EventPass.create({
    bookingId: bookingDoc._id,
    eventSlotId: bookingDoc.eventSlotId,
    guestUserId: bookingDoc.guestUserId,
    hostUserId: bookingDoc.hostUserId,
    eventCode,
    guestName: bookingDoc.guestName,
    guestMobile: bookingDoc.guestMobile,
    guestAge: bookingDoc.guestAge,
    guestGender: bookingDoc.guestGender,
    passType: "PRIMARY", // Keep for backward compatibility
    isValid: true,
    emailSent: false
  });
  
  return [String(pass._id)];
}

/**
 * Get event pass details by pass ID
 */
export async function getEventPassById(passId: string) {
  await connectMongo();
  
  const pass = await EventPass.findById(passId)
    .populate({ path: "eventSlotId", select: "eventName startAt endAt description" })
    .populate({ path: "hostUserId", select: "email" })
    .lean();
  
  if (!pass) {
    return null;
  }
  
  const passDoc = pass as any;
  
  // Get host profile and venue details
  const hostProfileDoc = await HostProfile.findOne({ userId: passDoc.hostUserId }).lean();
  const eventSlot = await EventSlot.findById(passDoc.eventSlotId).lean();
  
  if (!eventSlot) {
    return null;
  }
  
  const eventDoc = eventSlot as any;
  const venueDoc = await Venue.findById(eventDoc.venueId).lean();
  const hostUser = await User.findById(passDoc.hostUserId).select("email mobile").lean();
  const hostProfile = hostProfileDoc as any;
  const venue = venueDoc as any;
  
  // Get host name from HostProfile firstName and lastName
  const hostName = (hostProfile && hostProfile.firstName && hostProfile.lastName) 
    ? `${hostProfile.firstName} ${hostProfile.lastName}`.trim()
    : (hostProfile && hostProfile.firstName)
    ? hostProfile.firstName
    : "Host";
  
  // Get booking to fetch additional guests
  const booking = await Booking.findById(passDoc.bookingId).lean();
  const bookingDoc = booking as any;
  
  // Get all additional guests from the booking
  const additionalGuests = (bookingDoc?.additionalGuests || []).map((guest: any, index: number) => ({
    name: guest.name,
    mobile: guest.mobile,
    age: guest.age,
    gender: guest.gender,
    index: index
  }));
  
  return {
    passId: String(passDoc._id),
    eventCode: passDoc.eventCode,
    guestName: passDoc.guestName,
    guestMobile: passDoc.guestMobile,
    guestAge: passDoc.guestAge,
    guestGender: passDoc.guestGender,
    passType: passDoc.passType,
    isValid: passDoc.isValid,
    validatedAt: passDoc.validatedAt,
    additionalGuests: additionalGuests,
    event: {
      eventId: String(eventDoc._id),
      eventName: eventDoc.eventName,
      startAt: eventDoc.startAt,
      endAt: eventDoc.endAt,
      description: eventDoc.description
    },
    host: {
      hostId: String(passDoc.hostUserId),
      hostName: hostName,
      email: (hostUser as any)?.email || "",
      mobile: (hostUser as any)?.mobile || "",
      address: venue?.address || "",
      locality: venue?.locality || "",
      city: venue?.city || "",
      state: venue?.state || "",
      country: venue?.country || "",
      postalCode: venue?.postalCode || ""
    },
    venue: venue ? {
      venueId: String(venue._id),
      name: venue.name || "",
      address: venue.address || "",
      locality: venue.locality || "",
      city: venue.city || "",
      state: venue.state || "",
      country: venue.country || "",
      postalCode: venue.postalCode || ""
    } : null
  };
}

/**
 * Get event pass by event code (for host verification)
 */
export async function getEventPassByCode(eventCode: string) {
  await connectMongo();
  
  const pass = await EventPass.findOne({ eventCode: eventCode.toUpperCase() })
    .populate({ path: "eventSlotId", select: "eventName startAt endAt" })
    .lean();
  
  if (!pass) {
    return null;
  }
  
  const passDoc = pass as any;
  
  // Handle eventSlotId - it might be populated (object) or just an ObjectId
  const eventSlotIdValue = passDoc.eventSlotId;
  const eventSlotIdString = typeof eventSlotIdValue === 'object' && eventSlotIdValue?._id 
    ? String(eventSlotIdValue._id) 
    : String(eventSlotIdValue);
  
  return {
    passId: String(passDoc._id),
    eventCode: passDoc.eventCode,
    guestName: passDoc.guestName,
    guestMobile: passDoc.guestMobile,
    isValid: passDoc.isValid,
    validatedAt: passDoc.validatedAt,
    eventSlotId: eventSlotIdString,
    bookingId: String(passDoc.bookingId),
    eventName: (passDoc.eventSlotId as any)?.eventName || ""
  };
}

/**
 * Validate an event pass (mark as checked in)
 */
export async function validateEventPass(eventCode: string, validatedBy: string) {
  await connectMongo();
  
  const pass = await EventPass.findOneAndUpdate(
    { eventCode: eventCode.toUpperCase(), isValid: true },
    {
      $set: {
        isValid: false,
        validatedAt: new Date(),
        validatedBy
      }
    },
    { new: true }
  );
  
  if (!pass) {
    return null;
  }
  
  // Also update booking check-in status
  await Booking.findByIdAndUpdate(
    (pass as any).bookingId,
    {
      $set: {
        checkedInAt: new Date(),
        checkedInBy: validatedBy
      }
    }
  );
  
  return {
    passId: String((pass as any)._id),
    guestName: (pass as any).guestName,
    eventCode: (pass as any).eventCode
  };
}

/**
 * Get pass for a booking (single pass with all guests)
 */
export async function getEventPassesByBooking(bookingId: string) {
  await connectMongo();
  
  // Get the single pass for this booking
  const pass = await EventPass.findOne({ bookingId })
    .populate({ path: "eventSlotId", select: "eventName startAt endAt" })
    .lean();
  
  if (!pass) {
    return [];
  }
  
  const passDoc = pass as any;
  
  // Return single pass (all guest details will be included when pass is retrieved by ID)
  return [{
    passId: String(passDoc._id),
    eventCode: passDoc.eventCode,
    guestName: passDoc.guestName,
    passType: passDoc.passType,
    isValid: passDoc.isValid,
    validatedAt: passDoc.validatedAt
  }];
}
