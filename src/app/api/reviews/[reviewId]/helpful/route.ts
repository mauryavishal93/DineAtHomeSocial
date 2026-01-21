import { NextRequest } from "next/server";
import { requireAuth } from "@/server/auth/rbac";
import { connectMongo } from "@/server/db/mongoose";
import { Feedback } from "@/server/models/Feedback";
import { createResponse } from "@/server/http/response";

// Mark review as helpful/not helpful
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ reviewId: string }> }
) {
  try {
    const ctx = await requireAuth(req);
    await connectMongo();
    const { reviewId } = await params;

    const body = await req.json();
    const { helpful } = body; // boolean

    const review = await Feedback.findById(reviewId).lean();
    if (!review) {
      return createResponse({ error: "Review not found" }, { status: 404 });
    }

    const reviewDoc = review as any;
    const helpfulUsers = reviewDoc.helpfulUsers || [];
    const userId = ctx.userId;
    const isAlreadyHelpful = helpfulUsers.some((id: any) => String(id) === String(userId));

    if (helpful && !isAlreadyHelpful) {
      // Add to helpful
      await Feedback.updateOne(
        { _id: reviewId },
        {
          $addToSet: { helpfulUsers: userId },
          $inc: { helpfulCount: 1 }
        }
      );
    } else if (!helpful && isAlreadyHelpful) {
      // Remove from helpful
      await Feedback.updateOne(
        { _id: reviewId },
        {
          $pull: { helpfulUsers: userId },
          $inc: { helpfulCount: -1 }
        }
      );
    }

    return createResponse({
      success: true,
      helpful: helpful && !isAlreadyHelpful
    });
  } catch (error: any) {
    return createResponse({ error: error.message }, { status: 401 });
  }
}
