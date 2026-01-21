import { NextRequest } from "next/server";
import { requireAuth } from "@/server/auth/rbac";
import { connectMongo } from "@/server/db/mongoose";
import { EventSlot } from "@/server/models/EventSlot";
import { Booking } from "@/server/models/Booking";
import { Payment } from "@/server/models/Payment";
import { Feedback } from "@/server/models/Feedback";
import { createResponse } from "@/server/http/response";

export async function GET(req: NextRequest) {
  try {
    const ctx = await requireAuth(req);
    if (ctx.role !== "HOST") {
      return createResponse({ error: "Forbidden" }, { status: 403 });
    }

    await connectMongo();

    const url = new URL(req.url);
    const days = parseInt(url.searchParams.get("days") || "30");
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get all events for this host
    const events = await EventSlot.find({
      hostUserId: ctx.userId
    })
      .select("_id eventName startAt endAt")
      .lean();

    const eventIds = events.map((e: any) => e._id);

    // Get bookings
    const bookings = await Booking.find({
      eventSlotId: { $in: eventIds },
      createdAt: { $gte: startDate },
      status: { $in: ["CONFIRMED", "COMPLETED"] }
    })
      .select("eventSlotId seats amountTotal createdAt")
      .lean();

    // Get payments
    const payments = await Payment.find({
      bookingId: { $in: bookings.map((b: any) => b._id) },
      status: "COMPLETED",
      createdAt: { $gte: startDate }
    })
      .select("amount createdAt")
      .lean();

    // Get reviews
    const reviews = await Feedback.find({
      eventSlotId: { $in: eventIds },
      feedbackType: "HOST",
      createdAt: { $gte: startDate }
    })
      .select("rating createdAt")
      .lean();

    // Calculate totals
    const totalRevenue = payments.reduce((sum: number, p: any) => sum + (p.amount || 0), 0);
    const totalBookings = bookings.length;
    const totalGuests = bookings.reduce((sum: number, b: any) => sum + (b.seats || 0), 0);
    const averageRating = reviews.length > 0
      ? reviews.reduce((sum: number, r: any) => sum + (r.rating || 0), 0) / reviews.length
      : 0;

    // Revenue by month
    const revenueByMonth: Record<string, number> = {};
    payments.forEach((p: any) => {
      const month = new Date(p.createdAt).toLocaleDateString("en-US", { month: "short", year: "numeric" });
      revenueByMonth[month] = (revenueByMonth[month] || 0) + (p.amount || 0);
    });

    // Bookings by month
    const bookingsByMonth: Record<string, number> = {};
    bookings.forEach((b: any) => {
      const month = new Date(b.createdAt).toLocaleDateString("en-US", { month: "short", year: "numeric" });
      bookingsByMonth[month] = (bookingsByMonth[month] || 0) + 1;
    });

    // Top events
    const eventRevenue: Record<string, { revenue: number; bookings: number; name: string }> = {};
    bookings.forEach((b: any) => {
      const eventId = String(b.eventSlotId);
      if (!eventRevenue[eventId]) {
        const event = events.find((e: any) => String(e._id) === eventId);
        eventRevenue[eventId] = {
          revenue: 0,
          bookings: 0,
          name: (event as any)?.eventName || "Event"
        };
      }
      eventRevenue[eventId].bookings += 1;
      eventRevenue[eventId].revenue += b.amountTotal || 0;
    });

    const topEvents = Object.entries(eventRevenue)
      .map(([eventId, data]) => ({
        eventId,
        eventName: data.name,
        bookings: data.bookings,
        revenue: data.revenue
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // Get upcoming and past events
    const now = new Date();
    const upcomingEvents = events.filter((e: any) => new Date(e.startAt) > now).length;
    const pastEvents = events.filter((e: any) => new Date(e.endAt) < now).length;

    return createResponse({
      totalRevenue,
      totalBookings,
      totalGuests,
      averageRating,
      totalReviews: reviews.length,
      upcomingEvents,
      pastEvents,
      revenueByMonth: Object.entries(revenueByMonth)
        .map(([month, revenue]) => ({ month, revenue }))
        .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime()),
      bookingsByMonth: Object.entries(bookingsByMonth)
        .map(([month, count]) => ({ month, count }))
        .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime()),
      topEvents
    });
  } catch (error: any) {
    return createResponse({ error: error.message }, { status: 401 });
  }
}
