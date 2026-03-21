import { NextRequest } from "next/server";
import { requireAuth } from "@/server/auth/rbac";
import { connectMongo } from "@/server/db/mongoose";
import { createResponse } from "@/server/http/response";
import { Report } from "@/server/models/Report";

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
      reportedMessageId,
      reason,
      description,
      evidence // URLs to screenshots, etc.
    } = body;

    if (!reportType || !reason) {
      return createResponse({ error: "reportType and reason are required" }, { status: 400 });
    }

    // Validate at least one target is provided for the chosen reportType
    if (reportType === "USER" && !reportedUserId) {
      return createResponse({ error: "reportedUserId is required for USER reports" }, { status: 400 });
    }
    if (reportType === "EVENT" && !reportedEventId) {
      return createResponse({ error: "reportedEventId is required for EVENT reports" }, { status: 400 });
    }
    if (reportType === "REVIEW" && !reportedReviewId) {
      return createResponse({ error: "reportedReviewId is required for REVIEW reports" }, { status: 400 });
    }
    if (reportType === "MESSAGE" && !reportedMessageId) {
      return createResponse({ error: "reportedMessageId is required for MESSAGE reports" }, { status: 400 });
    }

    const report = await Report.create({
      reporterUserId: ctx.userId,
      reportType,
      reportedUserId: reportedUserId || null,
      reportedEventId: reportedEventId || null,
      reportedReviewId: reportedReviewId || null,
      reportedMessageId: reportedMessageId || null,
      reason: String(reason),
      description: String(description || ""),
      evidence: Array.isArray(evidence) ? evidence.map(String).slice(0, 10) : []
    });

    // Send notification to admins
    // await Notification.create({
    //   userId: adminIds,
    //   type: "REPORT_SUBMITTED",
    //   title: "New Report",
    //   message: `A ${reportType.toLowerCase()} has been reported`
    // });

    return createResponse({
      success: true,
      reportId: String((report as any)._id),
      message: "Report submitted successfully. Our team will review it within 24 hours."
    });
  } catch (error: any) {
    return createResponse({ error: error.message }, { status: 401 });
  }
}
