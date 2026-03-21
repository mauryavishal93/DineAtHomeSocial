import { NextRequest } from "next/server";
import { connectMongo } from "@/server/db/mongoose";
import { requireAuth } from "@/server/auth/rbac";
import { createResponse } from "@/server/http/response";
import { SupportTicket } from "@/server/models/SupportTicket";
import { sendEmail } from "@/server/services/emailService";
import { Notification } from "@/server/models/Notification";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    await connectMongo();

    // Auth is optional for support contact (guests can also reach out)
    let userId: string | null = null;
    try {
      const ctx = await requireAuth(req);
      userId = ctx.userId;
    } catch {
      // ignore
    }

    const body = await req.json();
    const name = String(body?.name || "").trim();
    const email = String(body?.email || "").trim().toLowerCase();
    const subject = String(body?.subject || "").trim();
    const message = String(body?.message || "").trim();

    if (!name || !email || !subject || !message) {
      return createResponse(
        { error: "name, email, subject, and message are required" },
        { status: 400 }
      );
    }

    const ticket = await SupportTicket.create({
      userId,
      name,
      email,
      subject,
      message
    });

    // Create a notification for the user (if logged in)
    if (userId) {
      await Notification.create({
        userId,
        type: "SUPPORT_TICKET_CREATED",
        title: "Support ticket created",
        message: `We received your request: "${subject}". We'll respond within 24 hours.`,
        metadata: { ticketId: String((ticket as any)._id) }
      });
    }

    // Best-effort email to support inbox
    const inbox = process.env.SUPPORT_INBOX_EMAIL || process.env.EMAIL_FROM;
    if (inbox) {
      await sendEmail({
        to: inbox,
        subject: `[Support] ${subject}`,
        html: `
          <div style="font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial; line-height:1.5;">
            <h2 style="margin:0 0 8px;">New support request</h2>
            <p style="margin:0 0 12px;"><strong>Ticket ID:</strong> ${String((ticket as any)._id)}</p>
            <p style="margin:0 0 12px;"><strong>Name:</strong> ${name}</p>
            <p style="margin:0 0 12px;"><strong>Email:</strong> ${email}</p>
            <p style="margin:0 0 12px;"><strong>Subject:</strong> ${subject}</p>
            <pre style="white-space:pre-wrap;background:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;padding:12px;margin:0;">${message}</pre>
          </div>
        `.trim()
      });
    }

    // Best-effort confirmation email to user
    await sendEmail({
      to: email,
      subject: `We received your request: ${subject}`,
      html: `
        <div style="font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial; line-height:1.5;">
          <h2 style="margin:0 0 8px;">Thanks for contacting support</h2>
          <p style="margin:0 0 12px;">We received your request and will respond within 24 hours.</p>
          <p style="margin:0 0 12px;"><strong>Ticket ID:</strong> ${String((ticket as any)._id)}</p>
          <p style="margin:0 0 12px;"><strong>Subject:</strong> ${subject}</p>
        </div>
      `.trim()
    });

    return createResponse({
      success: true,
      ticketId: String((ticket as any)._id),
      message: "Thank you for contacting us! We'll get back to you within 24 hours."
    });
  } catch (error: any) {
    return createResponse({ error: error.message || "Failed to submit support request" }, { status: 500 });
  }
}

