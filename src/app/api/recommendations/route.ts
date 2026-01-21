import { NextRequest } from "next/server";
import { requireAuth } from "@/server/auth/rbac";
import { connectMongo } from "@/server/db/mongoose";
import { EventSlot } from "@/server/models/EventSlot";
import { GuestProfile } from "@/server/models/GuestProfile";
import { Booking } from "@/server/models/Booking";
import { Feedback } from "@/server/models/Feedback";
import { Venue } from "@/server/models/Venue";
import { HostProfile } from "@/server/models/HostProfile";
import { createResponse } from "@/server/http/response";
import { listPublicEvents } from "@/server/services/eventService";

export async function GET(req: NextRequest) {
  try {
    const ctx = await requireAuth(req);
    if (ctx.role !== "GUEST") {
      return createResponse({ error: "Only for guests" }, { status: 403 });
    }

    await connectMongo();

    // Get guest profile
    const guestProfile = await GuestProfile.findOne({ userId: ctx.userId }).lean();
    const guest = guestProfile as any;

    // Get guest's past bookings to understand preferences
    const pastBookings = await Booking.find({
      guestUserId: ctx.userId,
      status: "COMPLETED"
    })
      .populate({ path: "eventSlotId", select: "foodTags cuisines foodType gamesAvailable" })
      .limit(10)
      .lean();

    // Get guest's ratings to find preferred hosts
    const guestRatings = await Feedback.find({
      fromUserId: ctx.userId,
      feedbackType: "HOST"
    })
      .select("eventSlotId rating")
      .lean();

    // Build preference scores
    const preferredFoodTags = new Map<string, number>();
    const preferredCuisines = new Map<string, number>();
    const preferredActivities = new Map<string, number>();
    const preferredHosts = new Set<string>();

    pastBookings.forEach((booking: any) => {
      const event = booking.eventSlotId;
      if (event) {
        (event.foodTags || []).forEach((tag: string) => {
          preferredFoodTags.set(tag, (preferredFoodTags.get(tag) || 0) + 1);
        });
        (event.cuisines || []).forEach((cuisine: string) => {
          preferredCuisines.set(cuisine, (preferredCuisines.get(cuisine) || 0) + 1);
        });
        (event.gamesAvailable || []).forEach((activity: string) => {
          preferredActivities.set(activity, (preferredActivities.get(activity) || 0) + 1);
        });
      }
    });

    guestRatings.forEach((rating: any) => {
      if (rating.rating >= 4) {
        // Liked this host
        const booking = pastBookings.find((b: any) => String(b.eventSlotId?._id) === String(rating.eventSlotId));
        if (booking) {
          preferredHosts.add(String((booking as any).hostUserId));
        }
      }
    });

    // Get all events
    const allEvents = await listPublicEvents();

    // Score events based on preferences
    const scoredEvents = allEvents.map((event) => {
      let score = 0;

      // Food tags match
      event.foodTags?.forEach((tag) => {
        score += (preferredFoodTags.get(tag) || 0) * 2;
      });

      // Cuisine match
      event.cuisines?.forEach((cuisine) => {
        score += (preferredCuisines.get(cuisine) || 0) * 3;
      });

      // Activities match
      event.activities?.forEach((activity) => {
        score += (preferredActivities.get(activity) || 0) * 2;
      });

      // Preferred host bonus
      if (preferredHosts.has(event.hostUserId)) {
        score += 10;
      }

      // High rating bonus
      if (event.hostRating >= 4.5) {
        score += 5;
      }

      // Guest profile interests match
      if (guest?.interests) {
        const interests = guest.interests.map((i: string) => i.toLowerCase());
        event.foodTags?.forEach((tag) => {
          if (interests.includes(tag.toLowerCase())) {
            score += 3;
          }
        });
      }

      return { ...event, recommendationScore: score };
    });

    // Sort by score and return top 10
    const recommendations = scoredEvents
      .filter((e) => e.recommendationScore > 0)
      .sort((a, b) => b.recommendationScore - a.recommendationScore)
      .slice(0, 10)
      .map(({ recommendationScore, ...event }) => event);

    return createResponse({ recommendations });
  } catch (error: any) {
    return createResponse({ error: error.message }, { status: 401 });
  }
}
