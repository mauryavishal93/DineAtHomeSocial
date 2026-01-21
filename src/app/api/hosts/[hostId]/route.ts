import { ok, serverError } from "@/server/http/response";
import { connectMongo } from "@/server/db/mongoose";
import { User } from "@/server/models/User";
import { HostProfile } from "@/server/models/HostProfile";
import { Venue } from "@/server/models/Venue";
import { EventSlot } from "@/server/models/EventSlot";
import { Feedback } from "@/server/models/Feedback";
import { Booking } from "@/server/models/Booking";

export const runtime = "nodejs";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ hostId: string }> }
) {
  try {
    await connectMongo();
    const { hostId } = await params;

    // Get user
    const userDoc = await User.findById(hostId).lean();
    if (!userDoc || (userDoc as any).role !== "HOST") {
      return serverError("Host not found");
    }
    const user = userDoc as any;

    // Get host profile
    const hostProfile = await HostProfile.findOne({ userId: hostId }).lean();
    if (!hostProfile) {
      return serverError("Host profile not found");
    }

    // Get venue
    const venueId = (hostProfile as any).venueId;
    const venue = venueId
      ? await Venue.findById(venueId).lean()
      : await Venue.findOne({ hostUserId: hostId }).lean();

    // Get all events (past and upcoming)
    const now = new Date();
    const allEvents = await EventSlot.find({ hostUserId: hostId })
      .sort({ startAt: -1 })
      .lean();

    const upcomingEvents = allEvents.filter(
      (e: any) => new Date(e.startAt) > now && e.status !== "CANCELLED"
    );
    const pastEvents = allEvents.filter(
      (e: any) => new Date(e.startAt) <= now || e.status === "CANCELLED"
    );

    // Get event IDs for reviews
    const eventIds = allEvents.map((e: any) => String(e._id));

    // Get all reviews for this host
    const reviews = await Feedback.find({
      toUserId: hostId,
      feedbackType: "HOST"
    })
      .populate("fromUserId", "email")
      .populate("eventSlotId", "eventName startAt")
      .sort({ createdAt: -1 })
      .lean();

    // Get booking counts for events
    const bookingCounts = await Booking.aggregate([
      {
        $match: {
          eventSlotId: { $in: allEvents.map((e: any) => e._id) },
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

    // Process events with booking counts
    const processEvents = (events: any[]) => {
      return events.map((e: any) => ({
        _id: String(e._id),
        eventName: e.eventName,
        startAt: e.startAt,
        endAt: e.endAt,
        status: e.status,
        basePricePerGuest: e.basePricePerGuest,
        maxGuests: e.maxGuests,
        seatsRemaining: e.seatsRemaining,
        bookingsCount: bookingMap.get(String(e._id)) || 0,
        images: e.images || [],
        videos: e.videos || []
      }));
    };

    // Process reviews
    const processedReviews = reviews.map((r: any) => {
      const fromUser = r.fromUserId as any;
      const event = r.eventSlotId as any;
      return {
        _id: String(r._id),
        fromUserId: String(fromUser?._id || r.fromUserId),
        fromUserEmail: fromUser?.email || "",
        eventId: event ? String(event._id) : String(r.eventSlotId),
        eventName: event?.eventName || "N/A",
        eventDate: event?.startAt || r.createdAt,
        rating: r.rating,
        eventRating: r.eventRating || 0,
        venueRating: r.venueRating || 0,
        foodRating: r.foodRating || 0,
        hospitalityRating: r.hospitalityRating || 0,
        comment: r.comment || "",
        createdAt: r.createdAt,
        isHidden: r.isHidden || false
      };
    });

    // Filter out hidden reviews
    const visibleReviews = processedReviews.filter((r) => !r.isHidden);

    // Calculate average ratings
    const hostProfileDoc = hostProfile as any;
    const avgRatings = {
      overall: hostProfileDoc.ratingAvg || 0,
      event: visibleReviews.length > 0
        ? visibleReviews.reduce((sum, r) => sum + (r.eventRating || 0), 0) / visibleReviews.length
        : 0,
      venue: visibleReviews.length > 0
        ? visibleReviews.reduce((sum, r) => sum + (r.venueRating || 0), 0) / visibleReviews.length
        : 0,
      food: visibleReviews.length > 0
        ? visibleReviews.reduce((sum, r) => sum + (r.foodRating || 0), 0) / visibleReviews.length
        : 0,
      hospitality: visibleReviews.length > 0
        ? visibleReviews.reduce((sum, r) => sum + (r.hospitalityRating || 0), 0) / visibleReviews.length
        : 0
    };

    const venueDoc = venue as any;
    const geo = venueDoc?.geo?.coordinates;

    return ok({
      host: {
        _id: String(user._id),
        email: user.email,
        hostUserId: hostId,
        firstName: (hostProfile as any).firstName || "",
        lastName: (hostProfile as any).lastName || "",
        bio: (hostProfile as any).bio || "",
        hostTier: (hostProfile as any).hostTier || "STANDARD",
        isIdentityVerified: (hostProfile as any).isIdentityVerified || false,
        isCulinaryCertified: (hostProfile as any).isCulinaryCertified || false,
        profileImagePath: (hostProfile as any).profileImagePath || "",
        coverImagePath: (hostProfile as any).coverImagePath || ""
      },
      venue: venueDoc
        ? {
            _id: String(venueDoc._id),
            name: venueDoc.name || "",
            address: venueDoc.address || "",
            locality: venueDoc.locality || "",
            description: venueDoc.description || "",
            foodCategories: venueDoc.foodCategories || [],
            gamesAvailable: venueDoc.gamesAvailable || [],
            latitude: geo && geo.length === 2 ? geo[1] : null,
            longitude: geo && geo.length === 2 ? geo[0] : null,
            images: venueDoc.images || []
          }
        : {
            _id: "",
            name: "",
            address: "",
            locality: "",
            description: "",
            foodCategories: [],
            gamesAvailable: [],
            latitude: null,
            longitude: null,
            images: []
          },
      stats: {
        totalEventsHosted: (hostProfile as any).totalEventsHosted || 0,
        totalGuestsServed: (hostProfile as any).totalGuestsServed || 0,
        ratingAvg: (hostProfile as any).ratingAvg || 0,
        ratingCount: (hostProfile as any).ratingCount || 0
      },
      ratings: avgRatings,
      upcomingEvents: processEvents(upcomingEvents),
      pastEvents: processEvents(pastEvents),
      reviews: visibleReviews
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    console.error("Host profile GET error:", msg);
    return serverError(`Failed to load host profile: ${msg}`);
  }
}
