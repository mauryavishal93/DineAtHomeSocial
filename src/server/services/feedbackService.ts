import { connectMongo } from "@/server/db/mongoose";
import { Feedback } from "@/server/models/Feedback";
import { EventSlot } from "@/server/models/EventSlot";
import { Booking } from "@/server/models/Booking";
import { User } from "@/server/models/User";
import { GuestProfile } from "@/server/models/GuestProfile";
import { HostProfile } from "@/server/models/HostProfile";

export type CoGuestForRating = {
  userId: string;
  guestName: string;
  alreadyRated: boolean;
};

export type HostForRating = {
  userId: string;
  hostName: string;
  venueName: string;
  alreadyRated: boolean;
};

/**
 * Check if an event is completed (past end time)
 */
export async function isEventCompleted(eventSlotId: string): Promise<boolean> {
  await connectMongo();
  
  const event = await EventSlot.findById(eventSlotId).lean();
  if (!event) return false;
  
  const now = new Date();
  const endTime = new Date((event as any).endAt);
  
  return now > endTime;
}

/**
 * Check if user can rate the event (has attended and event is complete)
 */
export async function canRateEvent(guestUserId: string, eventSlotId: string): Promise<{
  canRate: boolean;
  reason?: string;
  bookingId?: string;
}> {
  await connectMongo();
  
  // Check if event is completed
  const completed = await isEventCompleted(eventSlotId);
  if (!completed) {
    return { canRate: false, reason: "Event not yet completed" };
  }
  
  // Check if user has a booking (PAYMENT_PENDING is also valid since payment flow might not be complete)
  const booking = await Booking.findOne({
    guestUserId,
    eventSlotId,
    status: { $in: ["CONFIRMED", "COMPLETED", "PAYMENT_PENDING"] }
  }).lean();
  
  if (!booking) {
    return { canRate: false, reason: "No booking found for this event" };
  }
  
  return { 
    canRate: true, 
    bookingId: String((booking as any)._id) 
  };
}

/**
 * Get list of co-guests for rating (excluding the current user)
 */
export async function getCoGuestsForRating(
  guestUserId: string, 
  eventSlotId: string
): Promise<CoGuestForRating[]> {
  await connectMongo();
  
  // Get all bookings for this event, excluding current user
  const bookings = await Booking.find({
    eventSlotId,
    guestUserId: { $ne: guestUserId },
    status: { $in: ["CONFIRMED", "COMPLETED", "PAYMENT_PENDING"] }
  }).lean();
  
  // Check which guests have already been rated by current user
  const existingFeedback = await Feedback.find({
    eventSlotId,
    fromUserId: guestUserId,
    feedbackType: "GUEST"
  }).lean();
  
  const ratedUserIds = new Set(existingFeedback.map((f: any) => String(f.toUserId)));
  
  const coGuests: CoGuestForRating[] = [];
  
  for (const booking of bookings) {
    const b = booking as any;
    const guestId = String(b.guestUserId);
    
    coGuests.push({
      userId: guestId,
      guestName: b.guestName || "Guest",
      alreadyRated: ratedUserIds.has(guestId)
    });
  }
  
  return coGuests;
}

/**
 * Get host details for rating
 */
export async function getHostForRating(
  guestUserId: string,
  eventSlotId: string
): Promise<HostForRating | null> {
  await connectMongo();
  
  const event = await EventSlot.findById(eventSlotId)
    .populate({ path: "venueId", select: "name" })
    .lean();
  
  if (!event) return null;
  
  const e = event as any;
  const hostUserId = String(e.hostUserId);
  
  // Get host details
  const host = await User.findById(hostUserId).lean();
  const hostName = (host as any)?.name || "Host";
  
  const venueName = e.venueId?.name || "Venue";
  
  // Check if already rated
  const existingFeedback = await Feedback.findOne({
    eventSlotId,
    fromUserId: guestUserId,
    toUserId: hostUserId,
    feedbackType: "HOST"
  }).lean();
  
  return {
    userId: hostUserId,
    hostName,
    venueName,
    alreadyRated: !!existingFeedback
  };
}

/**
 * Submit host rating (4 criteria: event, venue, food, hospitality)
 */
export async function submitHostRating(data: {
  guestUserId: string;
  eventSlotId: string;
  bookingId: string;
  hostUserId: string;
  eventRating: number;
  venueRating: number;
  foodRating: number;
  hospitalityRating: number;
  comment?: string;
}): Promise<{ success: boolean; message: string }> {
  await connectMongo();
  
  const { 
    guestUserId, 
    eventSlotId, 
    bookingId, 
    hostUserId,
    eventRating,
    venueRating,
    foodRating,
    hospitalityRating,
    comment 
  } = data;
  
  // Calculate overall rating
  const overallRating = (eventRating + venueRating + foodRating + hospitalityRating) / 4;
  
  // Check if already rated
  const existing = await Feedback.findOne({
    eventSlotId,
    fromUserId: guestUserId,
    toUserId: hostUserId,
    feedbackType: "HOST"
  });
  
  if (existing) {
    return { success: false, message: "Host already rated for this event" };
  }
  
  // Create feedback
  await Feedback.create({
    eventSlotId,
    bookingId,
    fromUserId: guestUserId,
    toUserId: hostUserId,
    feedbackType: "HOST",
    rating: overallRating,
    eventRating,
    venueRating,
    foodRating,
    hospitalityRating,
    comment: comment || "",
    isVerifiedAttendance: true
  });
  
  // Update host's cumulative rating
  await updateHostCumulativeRating(hostUserId);
  
  return { success: true, message: "Host rating submitted successfully" };
}

/**
 * Submit co-guest rating (simple star rating)
 */
export async function submitGuestRating(data: {
  fromGuestUserId: string;
  eventSlotId: string;
  bookingId: string;
  toGuestUserId: string;
  rating: number;
  comment?: string;
}): Promise<{ success: boolean; message: string }> {
  await connectMongo();
  
  const { 
    fromGuestUserId, 
    eventSlotId, 
    bookingId, 
    toGuestUserId,
    rating,
    comment 
  } = data;
  
  // Check if already rated
  const existing = await Feedback.findOne({
    eventSlotId,
    fromUserId: fromGuestUserId,
    toUserId: toGuestUserId,
    feedbackType: "GUEST"
  });
  
  if (existing) {
    return { success: false, message: "Guest already rated for this event" };
  }
  
  // Create feedback
  await Feedback.create({
    eventSlotId,
    bookingId,
    fromUserId: fromGuestUserId,
    toUserId: toGuestUserId,
    feedbackType: "GUEST",
    rating,
    guestRating: rating,
    comment: comment || "",
    isVerifiedAttendance: true
  });
  
  // Update guest's cumulative rating
  await updateGuestCumulativeRating(toGuestUserId);
  
  return { success: true, message: "Guest rating submitted successfully" };
}

// ==========================================
// HOST TO GUEST RATING
// ==========================================

export async function canRateGuest(input: {
  hostUserId: string;
  eventSlotId: string;
  guestUserId: string;
}): Promise<{ canRate: boolean; reason?: string }> {
  await connectMongo();

  const { hostUserId, eventSlotId, guestUserId } = input;

  // 1. Check if event is completed
  const eventCompleted = await isEventCompleted(eventSlotId);
  if (!eventCompleted) {
    return { canRate: false, reason: "Event has not been completed yet" };
  }

  // 2. Check if this is the host's event
  const event = await EventSlot.findById(eventSlotId).lean();
  if (!event || String((event as any).hostUserId) !== hostUserId) {
    return { canRate: false, reason: "You are not the host of this event" };
  }

  // 3. Check if guest attended this event
  const booking = await Booking.findOne({
    eventSlotId,
    guestUserId,
    status: { $in: ["CONFIRMED", "COMPLETED", "PAYMENT_PENDING"] }
  }).lean();

  if (!booking) {
    return { canRate: false, reason: "Guest did not attend this event" };
  }

  // 4. Check if already rated
  const existingRating = await Feedback.findOne({
    eventSlotId,
    fromUserId: hostUserId,
    toUserId: guestUserId,
    feedbackType: "HOST_TO_GUEST"
  }).lean();

  if (existingRating) {
    return { canRate: false, reason: "You have already rated this guest" };
  }

  return { canRate: true };
}

export async function submitHostToGuestRating(input: {
  hostUserId: string;
  eventSlotId: string;
  bookingId: string;
  guestUserId: string;
  punctualityRating: number;
  appearanceRating: number;
  communicationRating: number;
  behaviorRating: number;
  engagementRating: number;
  overallPresenceRating: number;
  comment?: string;
}): Promise<{ success: boolean; message: string }> {
  await connectMongo();

  const {
    hostUserId,
    eventSlotId,
    bookingId,
    guestUserId,
    punctualityRating,
    appearanceRating,
    communicationRating,
    behaviorRating,
    engagementRating,
    overallPresenceRating,
    comment
  } = input;

  // Check eligibility
  const eligibility = await canRateGuest({ hostUserId, eventSlotId, guestUserId });
  if (!eligibility.canRate) {
    return { success: false, message: eligibility.reason || "Cannot rate this guest" };
  }

  // Calculate overall average
  const avgRating = (punctualityRating + appearanceRating + communicationRating + 
                     behaviorRating + engagementRating + overallPresenceRating) / 6;

  // Create feedback
  await Feedback.create({
    eventSlotId,
    bookingId,
    fromUserId: hostUserId,
    toUserId: guestUserId,
    feedbackType: "HOST_TO_GUEST",
    rating: Math.round(avgRating * 10) / 10,
    comment: comment || "",
    punctualityRating,
    appearanceRating,
    communicationRating,
    behaviorRating,
    engagementRating,
    overallPresenceRating,
    isVerifiedAttendance: true
  });

  // Update guest's cumulative rating
  await updateGuestCumulativeRating(guestUserId);

  return { success: true, message: "Guest rating submitted successfully" };
}

export async function getGuestRating(input: {
  hostUserId: string;
  eventSlotId: string;
  guestUserId: string;
}): Promise<any | null> {
  await connectMongo();

  const rating = await Feedback.findOne({
    eventSlotId: input.eventSlotId,
    fromUserId: input.hostUserId,
    toUserId: input.guestUserId,
    feedbackType: "HOST_TO_GUEST"
  }).lean();

  if (!rating) return null;

  const r = rating as any;

  return {
    punctualityRating: r.punctualityRating || 0,
    appearanceRating: r.appearanceRating || 0,
    communicationRating: r.communicationRating || 0,
    behaviorRating: r.behaviorRating || 0,
    engagementRating: r.engagementRating || 0,
    overallPresenceRating: r.overallPresenceRating || 0,
    comment: r.comment || "",
    ratedAt: r.createdAt
  };
}

/**
 * Update host's cumulative rating based on all feedback
 */
async function updateHostCumulativeRating(hostUserId: string): Promise<void> {
  const feedbacks = await Feedback.find({
    toUserId: hostUserId,
    feedbackType: "HOST",
    isHidden: false
  }).lean();
  
  if (feedbacks.length === 0) return;
  
  const totalRating = feedbacks.reduce((sum, f: any) => sum + (f.rating || 0), 0);
  const avgRating = totalRating / feedbacks.length;
  
  await HostProfile.findOneAndUpdate(
    { userId: hostUserId },
    {
      ratingAvg: avgRating,
      ratingCount: feedbacks.length
    }
  );
}

/**
 * Update guest's cumulative rating based on all feedback
 */
async function updateGuestCumulativeRating(guestUserId: string): Promise<void> {
  const feedbacks = await Feedback.find({
    toUserId: guestUserId,
    feedbackType: "GUEST",
    isHidden: false
  }).lean();
  
  if (feedbacks.length === 0) return;
  
  const totalRating = feedbacks.reduce((sum, f: any) => sum + (f.rating || 0), 0);
  const avgRating = totalRating / feedbacks.length;
  
  await GuestProfile.findOneAndUpdate(
    { userId: guestUserId },
    {
      ratingAvg: avgRating,
      ratingCount: feedbacks.length
    }
  );
}
