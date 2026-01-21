import { NextRequest } from "next/server";
import { requireAuth } from "@/server/auth/rbac";
import { connectMongo } from "@/server/db/mongoose";
import { Feedback } from "@/server/models/Feedback";
import { createResponse } from "@/server/http/response";

// Get review details
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ reviewId: string }> }
) {
  try {
    await connectMongo();
    const { reviewId } = await params;

    const review = await Feedback.findById(reviewId)
      .populate({ path: "fromUserId", select: "name" })
      .populate({ path: "toUserId", select: "name" })
      .populate({ path: "eventSlotId", select: "eventName" })
      .lean();

    if (!review) {
      return createResponse({ error: "Review not found" }, { status: 404 });
    }

    const reviewDoc = review as any;

    return createResponse({
      id: String(reviewDoc._id),
      fromUserName: reviewDoc.fromUserId?.name || "Anonymous",
      toUserName: reviewDoc.toUserId?.name || "User",
      eventName: reviewDoc.eventSlotId?.eventName || "Event",
      rating: reviewDoc.rating,
      comment: reviewDoc.comment || "",
      eventRating: reviewDoc.eventRating || 0,
      venueRating: reviewDoc.venueRating || 0,
      foodRating: reviewDoc.foodRating || 0,
      hospitalityRating: reviewDoc.hospitalityRating || 0,
      photos: reviewDoc.photos || [],
      createdAt: reviewDoc.createdAt,
      updatedAt: reviewDoc.updatedAt
    });
  } catch (error: any) {
    return createResponse({ error: error.message }, { status: 500 });
  }
}

// Update review (edit)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ reviewId: string }> }
) {
  try {
    const ctx = await requireAuth(req);
    await connectMongo();
    const { reviewId } = await params;

    const body = await req.json();
    const { rating, comment, eventRating, venueRating, foodRating, hospitalityRating } = body;

    const review = await Feedback.findById(reviewId).lean();
    if (!review) {
      return createResponse({ error: "Review not found" }, { status: 404 });
    }

    const reviewDoc = review as any;

    // Verify ownership
    if (String(reviewDoc.fromUserId) !== String(ctx.userId)) {
      return createResponse({ error: "Unauthorized" }, { status: 403 });
    }

    // Check if review can be edited (within 7 days)
    const createdAt = new Date(reviewDoc.createdAt);
    const now = new Date();
    const daysDiff = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24);

    if (daysDiff > 7) {
      return createResponse({ error: "Review can only be edited within 7 days" }, { status: 400 });
    }

    // Update review
    await Feedback.updateOne(
      { _id: reviewId },
      {
        $set: {
          rating: rating || reviewDoc.rating,
          comment: comment !== undefined ? comment : reviewDoc.comment,
          eventRating: eventRating !== undefined ? eventRating : reviewDoc.eventRating,
          venueRating: venueRating !== undefined ? venueRating : reviewDoc.venueRating,
          foodRating: foodRating !== undefined ? foodRating : reviewDoc.foodRating,
          hospitalityRating: hospitalityRating !== undefined ? hospitalityRating : reviewDoc.hospitalityRating,
          updatedAt: new Date()
        }
      }
    );

    return createResponse({
      success: true,
      message: "Review updated successfully"
    });
  } catch (error: any) {
    return createResponse({ error: error.message }, { status: 401 });
  }
}

// Host response to review
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ reviewId: string }> }
) {
  try {
    const ctx = await requireAuth(req);
    if (ctx.role !== "HOST") {
      return createResponse({ error: "Only hosts can respond to reviews" }, { status: 403 });
    }

    await connectMongo();
    const { reviewId } = await params;

    const body = await req.json();
    const { response } = body;

    if (!response || !response.trim()) {
      return createResponse({ error: "Response text is required" }, { status: 400 });
    }

    const review = await Feedback.findById(reviewId).lean();
    if (!review) {
      return createResponse({ error: "Review not found" }, { status: 404 });
    }

    const reviewDoc = review as any;

    // Verify host owns the reviewed event
    if (String(reviewDoc.toUserId) !== String(ctx.userId)) {
      return createResponse({ error: "Unauthorized" }, { status: 403 });
    }

    // Add host response
    await Feedback.updateOne(
      { _id: reviewId },
      {
        $set: {
          hostResponse: response.trim(),
          hostResponseAt: new Date()
        }
      }
    );

    return createResponse({
      success: true,
      message: "Response added successfully"
    });
  } catch (error: any) {
    return createResponse({ error: error.message }, { status: 401 });
  }
}
