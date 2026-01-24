import { ok, serverError } from "@/server/http/response";
import { connectMongo } from "@/server/db/mongoose";
import { Feedback } from "@/server/models/Feedback";
import { User } from "@/server/models/User";
import { GuestProfile } from "@/server/models/GuestProfile";
import { HostProfile } from "@/server/models/HostProfile";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    await connectMongo();
    
    // Get featured reviews (host ratings with comments, sorted by helpful count and rating)
    const reviews = await Feedback.find({
      feedbackType: "HOST",
      comment: { $exists: true, $ne: "" },
      isHidden: false,
      rating: { $gte: 4 } // Only 4+ star reviews
    })
      .populate({ path: "fromUserId", select: "email" })
      .populate({ path: "toUserId", select: "email" })
      .populate({ path: "eventSlotId", select: "eventName" })
      .sort({ helpfulCount: -1, rating: -1, createdAt: -1 })
      .limit(6)
      .lean();
    
    const processedReviews = await Promise.all(
      reviews.map(async (r: any) => {
        const fromUser = r.fromUserId as any;
        const toUser = r.toUserId as any;
        const event = r.eventSlotId as any;
        
        // Get guest profile for name
        const guestProfile = await GuestProfile.findOne({ userId: fromUser?._id }).lean();
        const hostProfile = await HostProfile.findOne({ userId: toUser?._id }).lean();
        
        const guestName = guestProfile
          ? `${(guestProfile as any).firstName || ""} ${(guestProfile as any).lastName || ""}`.trim()
          : fromUser?.email?.split("@")[0] || "Guest";
        
        const hostName = hostProfile
          ? `${(hostProfile as any).firstName || ""} ${(hostProfile as any).lastName || ""}`.trim()
          : toUser?.email?.split("@")[0] || "Host";
        
        return {
          id: String(r._id),
          guestName,
          hostName,
          eventName: event?.eventName || "Event",
          rating: r.rating,
          eventRating: r.eventRating || 0,
          venueRating: r.venueRating || 0,
          foodRating: r.foodRating || 0,
          hospitalityRating: r.hospitalityRating || 0,
          comment: r.comment || "",
          helpfulCount: r.helpfulCount || 0,
          createdAt: r.createdAt
        };
      })
    );
    
    return ok(processedReviews);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed";
    return serverError(msg);
  }
}
