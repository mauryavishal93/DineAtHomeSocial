import { NextRequest } from "next/server";
import { requireAuth } from "@/server/auth/rbac";
import { connectMongo } from "@/server/db/mongoose";
import { createResponse } from "@/server/http/response";

// Report a user or event
export async function POST(req: NextRequest) {
  try {
    const ctx = await requireAuth(req);
    await connectMongo();

    const body = await req.json();
    const { 
      reportType, // "USER", "EVENT", "REVIEW", "MESSAGE"
      reportedUserId,
      reportedEventId,
      reportedReviewId,
      reason,
      description,
      evidence // URLs to screenshots, etc.
    } = body;

    if (!reportType || !reason) {
      return createResponse({ error: "reportType and reason are required" }, { status: 400 });
    }

    // TODO: Create Report model and save report
    // For now, just log it
    console.log("Report submitted:", {
      reporterUserId: ctx.userId,
      reportType,
      reportedUserId,
      reportedEventId,
      reportedReviewId,
      reason,
      description,
      evidence,
      timestamp: new Date()
    });

    // In production, save to database:
    // await Report.create({
    //   reporterUserId: ctx.userId,
    //   reportType,
    //   reportedUserId,
    //   reportedEventId,
    //   reportedReviewId,
    //   reason,
    //   description,
    //   evidence,
    //   status: "PENDING"
    // });

    // Send notification to admins
    // await Notification.create({
    //   userId: adminIds,
    //   type: "REPORT_SUBMITTED",
    //   title: "New Report",
    //   message: `A ${reportType.toLowerCase()} has been reported`
    // });

    return createResponse({
      success: true,
      message: "Report submitted successfully. Our team will review it within 24 hours."
    });
  } catch (error: any) {
    return createResponse({ error: error.message }, { status: 401 });
  }
}
