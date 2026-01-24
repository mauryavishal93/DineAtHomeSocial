import { ok, serverError } from "@/server/http/response";
import { connectMongo } from "@/server/db/mongoose";
import { EventSlot } from "@/server/models/EventSlot";
import { Booking } from "@/server/models/Booking";
import { Feedback } from "@/server/models/Feedback";
import { Venue } from "@/server/models/Venue";
import { HostProfile } from "@/server/models/HostProfile";
import { User } from "@/server/models/User";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    await connectMongo();
    
    const now = new Date();
    
    // Get all open upcoming events
    const events = await EventSlot.find({
      status: "OPEN",
      endAt: { $gt: now }
    })
      .populate({ path: "venueId", select: "name city locality state address" })
      .populate({ path: "hostUserId", select: "email" })
      .lean();
    
    // Get booking counts and ratings for each event
    const eventIds = events.map((e: any) => e._id);
    
    const bookingCounts = await Booking.aggregate([
      {
        $match: {
          eventSlotId: { $in: eventIds },
          status: "CONFIRMED"
        }
      },
      {
        $group: {
          _id: "$eventSlotId",
          count: { $sum: 1 }
        }
      }
    ]);
    
    const bookingMap = new Map();
    bookingCounts.forEach((b: any) => {
      bookingMap.set(String(b._id), b.count);
    });
    
    // Get average ratings for events
    const ratings = await Feedback.aggregate([
      {
        $match: {
          eventSlotId: { $in: eventIds },
          feedbackType: "HOST"
        }
      },
      {
        $group: {
          _id: "$eventSlotId",
          avgRating: { $avg: "$rating" },
          count: { $sum: 1 }
        }
      }
    ]);
    
    const ratingMap = new Map();
    ratings.forEach((r: any) => {
      ratingMap.set(String(r._id), { avg: r.avgRating, count: r.count });
    });
    
    // Process events with popularity score
    const processedEvents = await Promise.all(
      events.map(async (e: any) => {
        const venue = e.venueId as any;
        const hostUser = e.hostUserId as any;
        const bookings = bookingMap.get(String(e._id)) || 0;
        const rating = ratingMap.get(String(e._id)) || { avg: 0, count: 0 };
        
        // Get host profile for name
        const hostProfile = await HostProfile.findOne({ userId: hostUser?._id }).lean();
        const hostName = hostProfile
          ? `${(hostProfile as any).firstName || ""} ${(hostProfile as any).lastName || ""}`.trim()
          : hostUser?.email?.split("@")[0] || "Host";
        
        // Calculate popularity score (bookings * 2 + rating * 10 + rating count)
        const popularityScore = bookings * 2 + rating.avg * 10 + rating.count;
        
        return {
          id: String(e._id),
          title: e.eventName,
          startAt: e.startAt,
          endAt: e.endAt,
          priceFrom: Math.round((e.basePricePerGuest || 0) / 100), // Convert paise to rupees
          seatsLeft: e.seatsRemaining || 0,
          maxGuests: e.maxGuests || 0,
          hostName,
          hostUserId: String(e.hostUserId),
          verified: (hostProfile as any)?.isIdentityVerified || false,
          governmentIdPath: (hostProfile as any)?.governmentIdPath || "",
          city: venue?.city || "",
          locality: venue?.locality || "",
          venueName: venue?.name || "",
          cuisines: e.cuisines || [],
          activities: e.gamesAvailable || [],
          eventImages: e.images || [],
          bookings,
          rating: rating.avg,
          ratingCount: rating.count,
          popularityScore
        };
      })
    );
    
    // Sort by popularity score and return top 6
    const trending = processedEvents
      .sort((a, b) => b.popularityScore - a.popularityScore)
      .slice(0, 6);
    
    return ok(trending);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed";
    return serverError(msg);
  }
}
