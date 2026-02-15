import { connectMongo } from "@/server/db/mongoose";
import { User } from "@/server/models/User";
import { HostProfile } from "@/server/models/HostProfile";
import { GuestProfile } from "@/server/models/GuestProfile";
import { EventSlot } from "@/server/models/EventSlot";
import { Booking } from "@/server/models/Booking";
import { Payment } from "@/server/models/Payment";
import { Venue } from "@/server/models/Venue";
import { AdminAction } from "@/server/models/AdminAction";
import { Feedback } from "@/server/models/Feedback";
import { Admin } from "@/server/models/Admin";
import type { Role, AccountStatus } from "@/server/models/_types";

const HOST_REGISTRATION_FEE = 50000; // 500 INR in paise
const PLATFORM_COMMISSION_RATE = 0.20; // 20%

export interface AnalyticsSummary {
  users: {
    total: number;
    hosts: number;
    guests: number;
    admins: number;
    pending: number;
    verified: number;
    active: number;
    suspended: number;
    growth: {
      today: number;
      thisWeek: number;
      thisMonth: number;
      lastMonth: number;
    };
  };
  events: {
    total: number;
    open: number;
    completed: number;
    cancelled: number;
    thisMonth: number;
    lastMonth: number;
  };
  bookings: {
    total: number;
    confirmed: number;
    cancelled: number;
    thisMonth: number;
    lastMonth: number;
    revenue: number; // Total booking revenue in paise
  };
  revenue: {
    totalRevenue: number; // Total platform revenue in paise
    registrationFees: number; // Host registration fees collected
    commissions: number; // Commission from bookings
    thisMonth: number;
    lastMonth: number;
    projectedMonthly: number;
  };
  traffic: {
    today: number;
    thisWeek: number;
    thisMonth: number;
    lastMonth: number;
  };
}

export async function getAnalyticsSummary(startDate?: Date, endDate?: Date): Promise<AnalyticsSummary> {
  await connectMongo();

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekAgo = new Date(todayStart.getTime() - 7 * 24 * 60 * 60 * 1000);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

  // Users
  const totalUsers = await User.countDocuments();
  const hosts = await User.countDocuments({ role: "HOST" });
  const guests = await User.countDocuments({ role: "GUEST" });
  const admins = await User.countDocuments({ role: "ADMIN" });
  const pending = await User.countDocuments({ status: "PENDING" });
  const verified = await User.countDocuments({ status: "VERIFIED" });
  const active = await User.countDocuments({ status: "ACTIVE" });
  const suspended = await User.countDocuments({ status: "SUSPENDED" });

  const usersToday = await User.countDocuments({ createdAt: { $gte: todayStart } });
  const usersThisWeek = await User.countDocuments({ createdAt: { $gte: weekAgo } });
  const usersThisMonth = await User.countDocuments({ createdAt: { $gte: monthStart } });
  const usersLastMonth = await User.countDocuments({
    createdAt: { $gte: lastMonthStart, $lt: monthStart }
  });

  // Events
  const totalEvents = await EventSlot.countDocuments();
  const openEvents = await EventSlot.countDocuments({ status: "OPEN" });
  const completedEvents = await EventSlot.countDocuments({ status: "COMPLETED" });
  const cancelledEvents = await EventSlot.countDocuments({ status: "CANCELLED" });
  const eventsThisMonth = await EventSlot.countDocuments({
    createdAt: { $gte: monthStart }
  });
  const eventsLastMonth = await EventSlot.countDocuments({
    createdAt: { $gte: lastMonthStart, $lt: monthStart }
  });

  // Bookings
  const totalBookings = await Booking.countDocuments();
  const confirmedBookings = await Booking.countDocuments({ status: "CONFIRMED" });
  const cancelledBookings = await Booking.countDocuments({ status: "CANCELLED" });
  const bookingsThisMonth = await Booking.countDocuments({
    createdAt: { $gte: monthStart }
  });
  const bookingsLastMonth = await Booking.countDocuments({
    createdAt: { $gte: lastMonthStart, $lt: monthStart }
  });

  // Calculate booking revenue
  const confirmedBookingDocs = await Booking.find({ status: "CONFIRMED" });
  const bookingRevenue = confirmedBookingDocs.reduce((sum, b) => sum + (b.amountTotal || 0), 0);

  // Revenue calculations
  // Registration fees: Each verified host pays registration fee
  const verifiedHostsCount = await User.countDocuments({ role: "HOST", status: { $in: ["VERIFIED", "ACTIVE"] } });
  const registrationFees = verifiedHostsCount * HOST_REGISTRATION_FEE;

  // Commissions: 20% of confirmed booking revenue
  const commissions = Math.round(bookingRevenue * PLATFORM_COMMISSION_RATE);

  // This month revenue (from payments)
  const paymentsThisMonth = await Payment.find({
    status: "PAID",
    createdAt: { $gte: monthStart }
  });
  const revenueThisMonth = paymentsThisMonth.reduce((sum, p) => sum + (p.amount || 0), 0);
  const commissionThisMonth = Math.round(revenueThisMonth * PLATFORM_COMMISSION_RATE);

  // Last month revenue
  const paymentsLastMonth = await Payment.find({
    status: "PAID",
    createdAt: { $gte: lastMonthStart, $lt: monthStart }
  });
  const revenueLastMonth = paymentsLastMonth.reduce((sum, p) => sum + (p.amount || 0), 0);
  const commissionLastMonth = Math.round(revenueLastMonth * PLATFORM_COMMISSION_RATE);

  const totalRevenue = registrationFees + commissions;

  // Traffic (approximation using user registrations and bookings)
  const trafficToday = usersToday + (await Booking.countDocuments({ createdAt: { $gte: todayStart } }));
  const trafficThisWeek = usersThisWeek + (await Booking.countDocuments({ createdAt: { $gte: weekAgo } }));
  const trafficThisMonth = usersThisMonth + bookingsThisMonth;
  const trafficLastMonth = usersLastMonth + bookingsLastMonth;

  // Projected monthly revenue (average of last 3 months trend)
  const avgMonthlyRevenue = (commissionThisMonth + commissionLastMonth) / 2;
  const projectedMonthly = registrationFees + avgMonthlyRevenue * 2; // Rough projection

  return {
    users: {
      total: totalUsers,
      hosts,
      guests,
      admins,
      pending,
      verified,
      active,
      suspended,
      growth: {
        today: usersToday,
        thisWeek: usersThisWeek,
        thisMonth: usersThisMonth,
        lastMonth: usersLastMonth
      }
    },
    events: {
      total: totalEvents,
      open: openEvents,
      completed: completedEvents,
      cancelled: cancelledEvents,
      thisMonth: eventsThisMonth,
      lastMonth: eventsLastMonth
    },
    bookings: {
      total: totalBookings,
      confirmed: confirmedBookings,
      cancelled: cancelledBookings,
      thisMonth: bookingsThisMonth,
      lastMonth: bookingsLastMonth,
      revenue: bookingRevenue
    },
    revenue: {
      totalRevenue,
      registrationFees,
      commissions,
      thisMonth: commissionThisMonth,
      lastMonth: commissionLastMonth,
      projectedMonthly
    },
    traffic: {
      today: trafficToday,
      thisWeek: trafficThisWeek,
      thisMonth: trafficThisMonth,
      lastMonth: trafficLastMonth
    }
  };
}

export interface UserListItem {
  _id: string;
  email: string;
  mobile: string;
  role: Role;
  status: AccountStatus;
  createdAt: Date;
  profile?: {
    firstName?: string;
    lastName?: string;
    age?: number;
    isIdentityVerified?: boolean;
    totalEventsHosted?: number;
    totalGuestsServed?: number;
    totalRevenue?: number;
    ratingAvg?: number;
    ratingCount?: number;
  };
}

export async function listUsers(filters: {
  role?: Role;
  status?: AccountStatus;
  search?: string;
  page?: number;
  limit?: number;
}): Promise<{ users: UserListItem[]; total: number; page: number; limit: number }> {
  await connectMongo();

  const page = filters.page || 1;
  const limit = filters.limit || 20;
  const skip = (page - 1) * limit;

  const query: any = {};
  if (filters.role) query.role = filters.role;
  if (filters.status) query.status = filters.status;
  if (filters.search) {
    query.$or = [
      { email: { $regex: filters.search, $options: "i" } },
      { mobile: { $regex: filters.search, $options: "i" } }
    ];
  }

  const total = await User.countDocuments(query);
  const users = await User.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  const userIds = users.map((u) => u._id);

  // Fetch profiles
  const hostProfiles = await HostProfile.find({ userId: { $in: userIds } }).lean();
  const guestProfiles = await GuestProfile.find({ userId: { $in: userIds } }).lean();

  const profileMap = new Map();
  hostProfiles.forEach((hp) => profileMap.set(String(hp.userId), hp));
  guestProfiles.forEach((gp) => profileMap.set(String(gp.userId), gp));

  const usersWithProfiles: UserListItem[] = users.map((u) => {
    const profile = profileMap.get(String(u._id));
    return {
      _id: String(u._id),
      email: u.email,
      mobile: u.mobile,
      role: u.role as Role,
      status: u.status as AccountStatus,
      createdAt: u.createdAt,
      profile: profile
        ? {
            firstName: (profile as any).firstName,
            lastName: (profile as any).lastName,
            age: (profile as any).age,
            isIdentityVerified: (profile as any).isIdentityVerified,
            totalEventsHosted: (profile as any).totalEventsHosted,
            totalGuestsServed: (profile as any).totalGuestsServed,
            totalRevenue: (profile as any).totalRevenue,
            ratingAvg: (profile as any).ratingAvg,
            ratingCount: (profile as any).ratingCount
          }
        : undefined
    };
  });

  return {
    users: usersWithProfiles,
    total,
    page,
    limit
  };
}

export async function updateUserStatus(
  userId: string,
  status: AccountStatus,
  adminId: string,
  adminUsername: string
): Promise<void> {
  await connectMongo();

  const user = await User.findById(userId);
  if (!user) throw new Error("User not found");

  const oldStatus = user.status;
  user.status = status;
  await user.save();

  // Log admin action
  await AdminAction.create({
    adminUserId: adminId,
    adminUsername,
    actionType: status === "SUSPENDED" ? "SUSPEND_USER" : "ACTIVATE_USER",
    targetType: "USER",
    targetUserId: userId,
    targetId: userId,
    metadata: { oldStatus, newStatus: status },
    description: `${status === "SUSPENDED" ? "Suspended" : "Activated"} user ${userId}`
  });
}

export async function verifyUser(
  userId: string,
  adminId: string,
  adminUsername: string
): Promise<void> {
  await connectMongo();

  const user = await User.findById(userId);
  if (!user) throw new Error("User not found");

  user.status = "VERIFIED";
  await user.save();

  // If host, mark as verified in profile
  if (user.role === "HOST") {
    await HostProfile.findOneAndUpdate(
      { userId },
      { isIdentityVerified: true, verificationDate: new Date() }
    );
  } else if (user.role === "GUEST") {
    await GuestProfile.findOneAndUpdate(
      { userId },
      { isIdentityVerified: true, verificationDate: new Date() }
    );
  }

  // Log admin action
  await AdminAction.create({
    adminUserId: adminId,
    adminUsername,
    actionType: "VERIFY_USER",
    targetType: "USER",
    targetUserId: userId,
    targetId: userId,
    metadata: { role: user.role },
    description: `Verified user ${userId}`
  });
}

export interface EventListItem {
  _id: string;
  eventName: string;
  hostUserId: string;
  hostName?: string;
  hostEmail?: string;
  startAt: Date;
  endAt: Date;
  maxGuests: number;
  seatsRemaining: number;
  status: string;
  basePricePerGuest: number;
  bookingsCount: number;
  revenue: number;
  createdAt: Date;
}

export async function listEvents(filters: {
  status?: string;
  hostUserId?: string;
  page?: number;
  limit?: number;
}): Promise<{ events: EventListItem[]; total: number }> {
  await connectMongo();

  const page = filters.page || 1;
  const limit = filters.limit || 20;
  const skip = (page - 1) * limit;

  const query: any = {};
  if (filters.status) query.status = filters.status;
  if (filters.hostUserId) query.hostUserId = filters.hostUserId;

  const total = await EventSlot.countDocuments(query);
  const events = await EventSlot.find(query)
    .sort({ startAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  const hostUserIds = [...new Set(events.map((e) => String(e.hostUserId)))];
  const hosts = await User.find({ _id: { $in: hostUserIds } }).lean();
  const hostProfiles = await HostProfile.find({ userId: { $in: hostUserIds } }).lean();
  
  const hostEmailMap = new Map(hosts.map((h: any) => [String(h._id), h.email]));
  const hostNameMap = new Map();
  hostProfiles.forEach((hp: any) => {
    const name = `${hp.firstName || ""} ${hp.lastName || ""}`.trim();
    if (name) hostNameMap.set(String(hp.userId), name);
  });

  // Get booking counts and revenue
  const eventIds = events.map((e) => String(e._id));
  const bookings = await Booking.find({ eventSlotId: { $in: eventIds }, status: "CONFIRMED" }).lean();
  const bookingMap = new Map<string, { count: number; revenue: number }>();

  bookings.forEach((b) => {
    const eventId = String(b.eventSlotId);
    const existing = bookingMap.get(eventId) || { count: 0, revenue: 0 };
    bookingMap.set(eventId, {
      count: existing.count + 1,
      revenue: existing.revenue + (b.amountTotal || 0)
    });
  });

  const eventsWithDetails: EventListItem[] = events.map((e) => {
    const bookingInfo = bookingMap.get(String(e._id)) || { count: 0, revenue: 0 };
    const hostUserIdStr = String(e.hostUserId);
    return {
      _id: String(e._id),
      eventName: e.eventName,
      hostUserId: hostUserIdStr,
      hostName: hostNameMap.get(hostUserIdStr) || "N/A",
      hostEmail: hostEmailMap.get(hostUserIdStr),
      startAt: e.startAt,
      endAt: e.endAt,
      maxGuests: e.maxGuests,
      seatsRemaining: e.seatsRemaining,
      status: e.status,
      basePricePerGuest: e.basePricePerGuest,
      bookingsCount: bookingInfo.count,
      revenue: bookingInfo.revenue,
      createdAt: e.createdAt
    };
  });

  return {
    events: eventsWithDetails,
    total
  };
}

export interface RevenueBreakdownItem {
  date: string;
  type: "REGISTRATION_FEE" | "COMMISSION";
  amount: number;
  hostId?: string;
  hostName?: string;
  eventId?: string;
  eventName?: string;
  eventDate?: Date;
}

export interface RevenueBreakdown {
  items: RevenueBreakdownItem[];
  summary: {
    totalRegistrationFees: number;
    totalCommissions: number;
    total: number;
  };
}

export async function getRevenueBreakdown(days: number = 30): Promise<RevenueBreakdown> {
  await connectMongo();

  const now = new Date();
  const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  
  // Get verified hosts per day (registration fees)
  const verifiedHosts = await User.find({
    role: "HOST",
    status: { $in: ["VERIFIED", "ACTIVE"] },
    createdAt: { $gte: startDate }
  }).sort({ createdAt: 1 }).lean();

  // Get host profiles for names
  const hostUserIds = verifiedHosts.map((h: any) => h._id);
  const hostProfiles = await HostProfile.find({ userId: { $in: hostUserIds } }).lean();
  const hostNameMap = new Map();
  hostProfiles.forEach((hp: any) => {
    const name = `${hp.firstName || ""} ${hp.lastName || ""}`.trim();
    if (name) hostNameMap.set(String(hp.userId), name);
  });

  // Get payments with booking and event details
  const payments = await Payment.find({
    status: "PAID",
    createdAt: { $gte: startDate }
  })
    .sort({ createdAt: 1 })
    .lean();

  // Get booking details for payments
  const paymentBookingIds = payments.map((p: any) => p.bookingId).filter(Boolean);
  const bookings = await Booking.find({ _id: { $in: paymentBookingIds } })
    .populate("eventSlotId", "eventName startAt")
    .populate("hostUserId")
    .lean();

  const bookingMap = new Map();
  bookings.forEach((b: any) => {
    bookingMap.set(String(b._id), b);
  });

  // Build detailed items
  const items: RevenueBreakdownItem[] = [];

  // Add registration fees
  verifiedHosts.forEach((host: any) => {
    const date = host.createdAt.toISOString().split("T")[0];
    const hostId = String(host._id);
    items.push({
      date,
      type: "REGISTRATION_FEE",
      amount: HOST_REGISTRATION_FEE,
      hostId,
      hostName: hostNameMap.get(hostId) || "N/A"
    });
  });

  // Add commissions with event details
  payments.forEach((payment: any) => {
    const date = payment.createdAt.toISOString().split("T")[0];
    const booking = bookingMap.get(String(payment.bookingId));
    const commission = Math.round((payment.amount || 0) * PLATFORM_COMMISSION_RATE);
    
    if (booking) {
      const event = booking.eventSlotId as any;
      const host = booking.hostUserId as any;
      const hostId = String(host?._id || booking.hostUserId);
      
      items.push({
        date,
        type: "COMMISSION",
        amount: commission,
        hostId,
        hostName: hostNameMap.get(hostId) || "N/A",
        eventId: event ? String(event._id) : undefined,
        eventName: event?.eventName,
        eventDate: event?.startAt
      });
    } else {
      // Fallback if booking not found
      items.push({
        date,
        type: "COMMISSION",
        amount: commission
      });
    }
  });

  // Calculate summary
  const totalRegistrationFees = items
    .filter((i) => i.type === "REGISTRATION_FEE")
    .reduce((sum, i) => sum + i.amount, 0);
  const totalCommissions = items
    .filter((i) => i.type === "COMMISSION")
    .reduce((sum, i) => sum + i.amount, 0);

  return {
    items: items.sort((a, b) => {
      const dateCompare = a.date.localeCompare(b.date);
      if (dateCompare !== 0) return dateCompare;
      // Within same date, show registration fees first
      if (a.type === "REGISTRATION_FEE" && b.type === "COMMISSION") return -1;
      if (a.type === "COMMISSION" && b.type === "REGISTRATION_FEE") return 1;
      return 0;
    }),
    summary: {
      totalRegistrationFees,
      totalCommissions,
      total: totalRegistrationFees + totalCommissions
    }
  };
}

export interface AdminEventDetail {
  event: {
    _id: string;
    eventName: string;
    theme: string;
    eventFormat: string;
    eventCategory: string;
    startAt: Date;
    endAt: Date;
    minGuests: number;
    maxGuests: number;
    seatsRemaining: number;
    status: string;
    basePricePerGuest: number;
    earlyBirdPrice: number;
    lastMinutePrice: number;
    groupDiscountPercent: number;
    foodType: string;
    cuisines: string[];
    foodTags: string[];
    gamesAvailable: string[];
    menuCourses: {
      starter: string;
      main: string;
      dessert: string;
      beverages: string;
      specialNotes: string;
    };
    images: Array<{ filePath: string; fileMime: string; fileName: string; uploadedAt: Date }>;
    videos: Array<{ filePath: string; fileMime: string; fileName: string; uploadedAt: Date }>;
    createdAt: Date;
  };
  host: {
    userId: string;
    email: string;
    mobile: string;
    firstName: string;
    lastName: string;
    age: number;
    hostTier: string;
    totalEventsHosted: number;
    totalGuestsServed: number;
    ratingAvg: number;
    ratingCount: number;
    isIdentityVerified: boolean;
    isCulinaryCertified: boolean;
  };
  venue: {
    _id: string;
    name: string;
    address: string;
    locality: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
    description: string;
    foodCategories: string[];
    gamesAvailable: string[];
    images: Array<{ filePath: string; fileMime: string; fileName: string; uploadedAt: Date }>;
    geo?: {
      coordinates?: number[]; // [longitude, latitude]
    };
  };
  bookings: Array<{
    _id: string;
    guestUserId: string;
    guestEmail: string;
    guestMobile: string;
    guestName: string;
    guestAge: number;
    guestGender: string;
    seats: number;
    pricePerSeat: number;
    amountTotal: number;
    status: string;
    guestTypeAtBooking: string;
    additionalGuests: Array<{
      name: string;
      mobile: string;
      age: number;
      gender: string;
    }>;
    payment: {
      _id: string;
      amount: number;
      currency: string;
      status: string;
      razorpayOrderId: string;
      razorpayPaymentId: string;
      createdAt: Date;
    } | null;
    createdAt: Date;
  }>;
  summary: {
    totalBookings: number;
    totalSeatsBooked: number;
    totalRevenue: number;
    platformCommission: number;
    confirmedBookings: number;
    pendingBookings: number;
    cancelledBookings: number;
  };
}

export async function getAdminEventDetail(eventId: string): Promise<AdminEventDetail> {
  await connectMongo();

  const eventDoc = await EventSlot.findById(eventId)
    .populate("venueId")
    .lean();
  if (!eventDoc) throw new Error("Event not found");
  
  // Type assertion to ensure event is a single document, not an array
  const event = eventDoc as any;

  // Extract hostUserId - handle both ObjectId and string
  const hostUserId = event.hostUserId?._id 
    ? String(event.hostUserId._id) 
    : String(event.hostUserId || "");

  // Get host info - cast to any to avoid TypeScript array inference issues
  const hostUserDoc = await User.findById(hostUserId).lean();
  const hostUser = (hostUserDoc as any) || null;
  const hostProfileDoc = await HostProfile.findOne({ userId: hostUserId }).lean();
  const hostProfile = (hostProfileDoc as any) || null;

  // Get venue - handle both populated object and ObjectId
  let venue: any = event.venueId;
  if (venue && typeof venue === 'object' && venue._id) {
    // Already populated
    venue = venue;
  } else if (venue) {
    // Not populated, fetch it
    venue = await Venue.findById(venue).lean();
  } else {
    venue = null;
  }

  // Get all bookings for this event
  const bookings = await Booking.find({ eventSlotId: eventId })
    .populate("guestUserId", "email mobile")
    .populate("paymentId")
    .sort({ createdAt: -1 })
    .lean();

  // Process bookings with payment info
  const bookingsWithDetails = bookings.map((b: any) => {
    // Handle populated guestUserId - could be object or ObjectId
    const guestUser = b.guestUserId?._id ? b.guestUserId : (typeof b.guestUserId === 'string' || !b.guestUserId ? null : b.guestUserId);
    const guestUserIdStr = guestUser?._id ? String(guestUser._id) : (typeof b.guestUserId === 'string' ? b.guestUserId : String(b.guestUserId));
    
    // Handle populated paymentId - could be object or ObjectId
    const payment = b.paymentId?._id ? b.paymentId : (typeof b.paymentId === 'string' || !b.paymentId ? null : b.paymentId);
    
    return {
      _id: String(b._id),
      guestUserId: guestUserIdStr,
      guestEmail: guestUser?.email || "",
      guestMobile: guestUser?.mobile || b.guestMobile || "",
      guestName: b.guestName,
      guestAge: b.guestAge,
      guestGender: b.guestGender,
      seats: b.seats,
      pricePerSeat: b.pricePerSeat,
      amountTotal: b.amountTotal,
      status: b.status,
      guestTypeAtBooking: b.guestTypeAtBooking,
      additionalGuests: b.additionalGuests || [],
      payment: payment
        ? {
            _id: String(payment._id),
            amount: payment.amount,
            currency: payment.currency,
            status: payment.status,
            razorpayOrderId: payment.razorpayOrderId || "",
            razorpayPaymentId: payment.razorpayPaymentId || "",
            createdAt: payment.createdAt
          }
        : null,
      createdAt: b.createdAt
    };
  });

  // Calculate summary
  const totalBookings = bookings.length;
  const totalSeatsBooked = bookings.reduce((sum, b: any) => sum + (b.seats || 0), 0);
  const totalRevenue = bookings
    .filter((b: any) => b.status === "CONFIRMED")
    .reduce((sum, b: any) => sum + (b.amountTotal || 0), 0);
  const platformCommission = Math.round(totalRevenue * PLATFORM_COMMISSION_RATE);
  const confirmedBookings = bookings.filter((b: any) => b.status === "CONFIRMED").length;
  const pendingBookings = bookings.filter((b: any) => b.status === "PAYMENT_PENDING").length;
  const cancelledBookings = bookings.filter((b: any) => b.status === "CANCELLED").length;

  return {
    event: {
      _id: String(event._id),
      eventName: event.eventName,
      theme: event.theme || "",
      eventFormat: event.eventFormat || "",
      eventCategory: event.eventCategory || "",
      startAt: event.startAt,
      endAt: event.endAt,
      minGuests: event.minGuests || 0,
      maxGuests: event.maxGuests,
      seatsRemaining: event.seatsRemaining,
      status: event.status,
      basePricePerGuest: event.basePricePerGuest,
      earlyBirdPrice: event.earlyBirdPrice || 0,
      lastMinutePrice: event.lastMinutePrice || 0,
      groupDiscountPercent: event.groupDiscountPercent || 0,
      foodType: event.foodType || "",
      cuisines: event.cuisines || [],
      foodTags: event.foodTags || [],
      gamesAvailable: event.gamesAvailable || [],
      menuCourses: event.menuCourses || {
        starter: "",
        main: "",
        dessert: "",
        beverages: "",
        specialNotes: ""
      },
      images: event.images || [],
      videos: event.videos || [],
      createdAt: event.createdAt
    },
    host: {
      userId: hostUserId,
      email: hostUser?.email || "",
      mobile: hostUser?.mobile || "",
      firstName: hostProfile?.firstName || "",
      lastName: hostProfile?.lastName || "",
      age: hostProfile?.age || 0,
      hostTier: hostProfile?.hostTier || "STANDARD",
      totalEventsHosted: hostProfile?.totalEventsHosted || 0,
      totalGuestsServed: hostProfile?.totalGuestsServed || 0,
      ratingAvg: hostProfile?.ratingAvg || 0,
      ratingCount: hostProfile?.ratingCount || 0,
      isIdentityVerified: hostProfile?.isIdentityVerified || false,
      isCulinaryCertified: hostProfile?.isCulinaryCertified || false
    },
    venue: venue
      ? {
          _id: String(venue._id),
          name: venue.name,
          address: venue.address,
          locality: venue.locality || "",
          city: venue.city || "",
          state: venue.state || "",
          country: venue.country || "",
          postalCode: venue.postalCode || "",
          description: venue.description || "",
          foodCategories: venue.foodCategories || [],
          gamesAvailable: venue.gamesAvailable || [],
          images: venue.images || [],
          geo: venue.geo && venue.geo.coordinates && venue.geo.coordinates.length === 2
            ? { coordinates: venue.geo.coordinates }
            : undefined
        }
      : {
          _id: "",
          name: "",
          address: "",
          locality: "",
          city: "",
          state: "",
          country: "",
          postalCode: "",
          description: "",
          foodCategories: [],
          gamesAvailable: [],
          images: [],
          geo: undefined
        },
    bookings: bookingsWithDetails,
    summary: {
      totalBookings,
      totalSeatsBooked,
      totalRevenue,
      platformCommission,
      confirmedBookings,
      pendingBookings,
      cancelledBookings
    }
  };
}

// ==========================================
// BOOKINGS MANAGEMENT
// ==========================================

export interface BookingListItem {
  _id: string;
  eventSlotId: string;
  eventName: string;
  hostUserId: string;
  hostName: string;
  hostEmail: string;
  guestUserId: string;
  guestName: string;
  guestEmail: string;
  guestMobile: string;
  seats: number;
  amountTotal: number;
  status: string;
  paymentStatus: string;
  paymentId: string | null;
  createdAt: Date;
  eventStartAt: Date;
}

export async function listBookings(filters: {
  status?: string;
  eventId?: string;
  hostUserId?: string;
  guestUserId?: string;
  page?: number;
  limit?: number;
}): Promise<{ bookings: BookingListItem[]; total: number }> {
  await connectMongo();

  const page = filters.page || 1;
  const limit = filters.limit || 20;
  const skip = (page - 1) * limit;

  const query: any = {};
  if (filters.status) query.status = filters.status;
  if (filters.eventId) query.eventSlotId = filters.eventId;
  if (filters.hostUserId) query.hostUserId = filters.hostUserId;
  if (filters.guestUserId) query.guestUserId = filters.guestUserId;

  const total = await Booking.countDocuments(query);
  const bookings = await Booking.find(query)
    .populate("eventSlotId", "eventName startAt")
    .populate("hostUserId", "email")
    .populate("guestUserId", "email mobile")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  const hostUserIds = [...new Set(bookings.map((b: any) => String(b.hostUserId?._id || b.hostUserId)))];
  const hostProfiles = await HostProfile.find({ userId: { $in: hostUserIds } }).lean();
  const hostNameMap = new Map();
  hostProfiles.forEach((hp: any) => {
    const name = `${hp.firstName || ""} ${hp.lastName || ""}`.trim();
    if (name) hostNameMap.set(String(hp.userId), name);
  });

  const bookingsWithDetails: BookingListItem[] = bookings.map((b: any) => {
    const event = b.eventSlotId as any;
    const hostUser = b.hostUserId as any;
    const guestUser = b.guestUserId as any;
    const hostUserIdStr = String(hostUser?._id || b.hostUserId);
    
    return {
      _id: String(b._id),
      eventSlotId: event ? String(event._id) : String(b.eventSlotId),
      eventName: event?.eventName || "N/A",
      hostUserId: hostUserIdStr,
      hostName: hostNameMap.get(hostUserIdStr) || "N/A",
      hostEmail: hostUser?.email || "",
      guestUserId: String(guestUser?._id || b.guestUserId),
      guestName: b.guestName,
      guestEmail: guestUser?.email || "",
      guestMobile: guestUser?.mobile || b.guestMobile || "",
      seats: b.seats,
      amountTotal: b.amountTotal,
      status: b.status,
      paymentStatus: b.paymentId ? "HAS_PAYMENT" : "NO_PAYMENT",
      paymentId: b.paymentId ? String(b.paymentId) : null,
      createdAt: b.createdAt,
      eventStartAt: event?.startAt || b.createdAt
    };
  });

  return { bookings: bookingsWithDetails, total };
}

export async function cancelBooking(bookingId: string, adminId: string, adminUsername: string): Promise<void> {
  await connectMongo();

  const booking = await Booking.findById(bookingId);
  if (!booking) throw new Error("Booking not found");
  if ((booking as any).status === "CANCELLED") throw new Error("Booking already cancelled");

  (booking as any).status = "CANCELLED";
  await booking.save();

  // Update event seats
  const event = await EventSlot.findById((booking as any).eventSlotId);
  if (event) {
    (event as any).seatsRemaining += (booking as any).seats;
    await event.save();
  }

  // Invalidate all event passes for this booking
  const { EventPass } = await import("@/server/models/EventPass");
  try {
    await EventPass.updateMany(
      { bookingId: booking._id },
      {
        $set: {
          isValid: false
        }
      }
    );
  } catch (passError) {
    console.error("Failed to invalidate event passes:", passError);
    // Continue even if pass invalidation fails
  }

  // Log admin action
  await AdminAction.create({
    adminUserId: adminId,
    adminUsername,
    actionType: "CANCEL_BOOKING",
    targetType: "BOOKING",
    targetId: bookingId,
    description: `Cancelled booking ${bookingId}`
  });
}

// ==========================================
// PAYMENTS & REFUNDS
// ==========================================

export interface PaymentListItem {
  _id: string;
  bookingId: string;
  eventName: string;
  guestName: string;
  guestEmail: string;
  amount: number;
  currency: string;
  status: string;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  createdAt: Date;
}

export async function listPayments(filters: {
  status?: string;
  page?: number;
  limit?: number;
}): Promise<{ payments: PaymentListItem[]; total: number }> {
  await connectMongo();

  const page = filters.page || 1;
  const limit = filters.limit || 20;
  const skip = (page - 1) * limit;

  const query: any = {};
  if (filters.status) query.status = filters.status;

  const total = await Payment.countDocuments(query);
  const payments = await Payment.find(query)
    .populate({
      path: "bookingId",
      populate: [
        { path: "eventSlotId", select: "eventName" },
        { path: "guestUserId", select: "email" }
      ]
    })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  const paymentsWithDetails: PaymentListItem[] = payments.map((p: any) => {
    const booking = p.bookingId as any;
    const event = booking?.eventSlotId as any;
    const guestUser = booking?.guestUserId as any;

    return {
      _id: String(p._id),
      bookingId: String(p.bookingId),
      eventName: event?.eventName || "N/A",
      guestName: booking?.guestName || "N/A",
      guestEmail: guestUser?.email || "",
      amount: p.amount,
      currency: p.currency,
      status: p.status,
      razorpayOrderId: p.razorpayOrderId || "",
      razorpayPaymentId: p.razorpayPaymentId || "",
      createdAt: p.createdAt
    };
  });

  return { payments: paymentsWithDetails, total };
}

export async function processRefund(
  paymentId: string,
  adminId: string,
  adminUsername: string,
  reason?: string
): Promise<void> {
  await connectMongo();

  const payment = await Payment.findById(paymentId);
  if (!payment) throw new Error("Payment not found");
  if ((payment as any).status !== "PAID") throw new Error("Payment must be PAID to refund");

  // Update payment status
  (payment as any).status = "REFUNDED";
  await payment.save();

  // Update booking status
  const booking = await Booking.findById((payment as any).bookingId);
  if (booking) {
    (booking as any).status = "REFUND_REQUIRED";
    await booking.save();
  }

  // Log admin action
  await AdminAction.create({
    adminUserId: adminId,
    adminUsername,
    actionType: "PROCESS_REFUND",
    targetType: "PAYMENT",
    targetId: paymentId,
    metadata: { reason },
    description: `Processed refund for payment ${paymentId}${reason ? `: ${reason}` : ""}`
  });
}

// ==========================================
// REVIEWS & FEEDBACK MODERATION
// ==========================================

export interface ReviewListItem {
  _id: string;
  eventSlotId: string;
  eventName: string;
  fromUserId: string;
  fromUserName: string;
  toUserId: string;
  toUserName: string;
  feedbackType: string;
  rating: number;
  comment: string;
  eventRating?: number;
  venueRating?: number;
  foodRating?: number;
  hospitalityRating?: number;
  isHidden: boolean;
  reportedCount: number;
  createdAt: Date;
}

export async function listReviews(filters: {
  feedbackType?: string;
  toUserId?: string;
  page?: number;
  limit?: number;
}): Promise<{ reviews: ReviewListItem[]; total: number }> {
  await connectMongo();

  const page = filters.page || 1;
  const limit = filters.limit || 20;
  const skip = (page - 1) * limit;

  const query: any = {};
  if (filters.feedbackType) query.feedbackType = filters.feedbackType;
  if (filters.toUserId) query.toUserId = filters.toUserId;

  const total = await Feedback.countDocuments(query);
  const reviews = await Feedback.find(query)
    .populate("eventSlotId", "eventName")
    .populate("fromUserId", "email")
    .populate("toUserId", "email")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  const userIds = new Set<string>();
  reviews.forEach((r: any) => {
    if (r.fromUserId) userIds.add(String(r.fromUserId?._id || r.fromUserId));
    if (r.toUserId) userIds.add(String(r.toUserId?._id || r.toUserId));
  });

  const hostProfiles = await HostProfile.find({ userId: { $in: Array.from(userIds) } }).lean();
  const guestProfiles = await GuestProfile.find({ userId: { $in: Array.from(userIds) } }).lean();
  const nameMap = new Map();
  hostProfiles.forEach((hp: any) => {
    const name = `${hp.firstName || ""} ${hp.lastName || ""}`.trim();
    if (name) nameMap.set(String(hp.userId), name);
  });
  guestProfiles.forEach((gp: any) => {
    const name = `${gp.firstName || ""} ${gp.lastName || ""}`.trim();
    if (name) nameMap.set(String(gp.userId), name);
  });

  const reviewsWithDetails: ReviewListItem[] = reviews.map((r: any) => {
    const event = r.eventSlotId as any;
    const fromUser = r.fromUserId as any;
    const toUser = r.toUserId as any;
    const fromUserIdStr = String(fromUser?._id || r.fromUserId);
    const toUserIdStr = String(toUser?._id || r.toUserId);

    return {
      _id: String(r._id),
      eventSlotId: event ? String(event._id) : String(r.eventSlotId),
      eventName: event?.eventName || "N/A",
      fromUserId: fromUserIdStr,
      fromUserName: nameMap.get(fromUserIdStr) || fromUser?.email || "N/A",
      toUserId: toUserIdStr,
      toUserName: nameMap.get(toUserIdStr) || toUser?.email || "N/A",
      feedbackType: r.feedbackType,
      rating: r.rating,
      comment: r.comment || "",
      eventRating: r.eventRating,
      venueRating: r.venueRating,
      foodRating: r.foodRating,
      hospitalityRating: r.hospitalityRating,
      isHidden: r.isHidden || false,
      reportedCount: r.reportedCount || 0,
      createdAt: r.createdAt
    };
  });

  return { reviews: reviewsWithDetails, total };
}

export async function hideReview(
  reviewId: string,
  adminId: string,
  adminUsername: string,
  reason?: string
): Promise<void> {
  await connectMongo();

  const review = await Feedback.findById(reviewId);
  if (!review) throw new Error("Review not found");

  (review as any).isHidden = true;
  await review.save();

  await AdminAction.create({
    adminUserId: adminId,
    adminUsername,
    actionType: "HIDE_REVIEW",
    targetType: "REVIEW",
    targetId: reviewId,
    metadata: { reason },
    description: `Hidden review ${reviewId}${reason ? `: ${reason}` : ""}`
  });
}

export async function showReview(
  reviewId: string,
  adminId: string,
  adminUsername: string
): Promise<void> {
  await connectMongo();

  const review = await Feedback.findById(reviewId);
  if (!review) throw new Error("Review not found");

  (review as any).isHidden = false;
  await review.save();

  await AdminAction.create({
    adminUserId: adminId,
    adminUsername,
    actionType: "SHOW_REVIEW",
    targetType: "REVIEW",
    targetId: reviewId,
    description: `Showed review ${reviewId}`
  });
}

// ==========================================
// USER DETAILS (HOST & GUEST)
// ==========================================

export interface UserDetailData {
  user: {
    _id: string;
    email: string;
    mobile: string;
    role: Role;
    status: AccountStatus;
    createdAt: Date;
  };
  profile: {
    firstName: string;
    lastName: string;
    age: number;
    bio?: string;
    interests?: string[];
    ratingAvg: number;
    ratingCount: number;
  } | null;
  hostProfile?: {
    hostTier: string;
    totalEventsHosted: number;
    totalGuestsServed: number;
    totalRevenue: number;
    isIdentityVerified: boolean;
    governmentIdPath?: string;
    isCulinaryCertified: boolean;
    verificationDate: Date | null;
  };
  guestProfile?: {
    guestType: string;
    totalBookings: number;
    totalSpent: number;
  };
  bookings: Array<{
    _id: string;
    eventName: string;
    eventDate: Date;
    seats: number;
    amountTotal: number;
    status: string;
  }>;
  events?: Array<{
    _id: string;
    eventName: string;
    startAt: Date;
    maxGuests: number;
    bookingsCount: number;
    revenue: number;
    status: string;
  }>;
  reviews: Array<{
    _id: string;
    eventName: string;
    rating: number;
    comment: string;
    feedbackType: string;
    createdAt: Date;
  }>;
}

export async function getUserDetail(userId: string): Promise<UserDetailData> {
  await connectMongo();

  const user = await User.findById(userId).lean();
  if (!user) throw new Error("User not found");

  const userDoc = user as any;

  // Get profile
  let hostProfile = null;
  let guestProfile = null;
  let profile = null;

  if (userDoc.role === "HOST") {
    hostProfile = await HostProfile.findOne({ userId }).lean();
    profile = hostProfile as any;
  } else if (userDoc.role === "GUEST") {
    guestProfile = await GuestProfile.findOne({ userId }).lean();
    profile = guestProfile as any;
  }

  // Get bookings
  const bookings = await Booking.find({ guestUserId: userId })
    .populate("eventSlotId", "eventName startAt")
    .sort({ createdAt: -1 })
    .limit(50)
    .lean();

  // Get events (if host)
  let events: any[] = [];
  if (userDoc.role === "HOST") {
    events = await EventSlot.find({ hostUserId: userId })
      .sort({ startAt: -1 })
      .limit(50)
      .lean();

    const eventIds = events.map((e: any) => String(e._id));
    const eventBookings = await Booking.find({
      eventSlotId: { $in: eventIds },
      status: "CONFIRMED"
    }).lean();

    const bookingMap = new Map();
    eventBookings.forEach((b: any) => {
      const eventId = String(b.eventSlotId);
      const existing = bookingMap.get(eventId) || { count: 0, revenue: 0 };
      bookingMap.set(eventId, {
        count: existing.count + 1,
        revenue: existing.revenue + (b.amountTotal || 0)
      });
    });

    events = events.map((e: any) => {
      const bookingInfo = bookingMap.get(String(e._id)) || { count: 0, revenue: 0 };
      return {
        _id: String(e._id),
        eventName: e.eventName,
        startAt: e.startAt,
        maxGuests: e.maxGuests,
        bookingsCount: bookingInfo.count,
        revenue: bookingInfo.revenue,
        status: e.status
      };
    });
  }

  // Get reviews
  const reviews = await Feedback.find({
    $or: [{ fromUserId: userId }, { toUserId: userId }]
  })
    .populate("eventSlotId", "eventName")
    .sort({ createdAt: -1 })
    .limit(50)
    .lean();

  return {
    user: {
      _id: String(userDoc._id),
      email: userDoc.email,
      mobile: userDoc.mobile,
      role: userDoc.role as Role,
      status: userDoc.status as AccountStatus,
      createdAt: userDoc.createdAt
    },
    profile: profile
      ? {
          firstName: (profile as any).firstName || "",
          lastName: (profile as any).lastName || "",
          age: (profile as any).age || 0,
          bio: (profile as any).bio,
          interests: (profile as any).interests || [],
          ratingAvg: (profile as any).ratingAvg || 0,
          ratingCount: (profile as any).ratingCount || 0
        }
      : null,
    hostProfile: hostProfile
      ? {
          hostTier: (hostProfile as any).hostTier || "STANDARD",
          totalEventsHosted: (hostProfile as any).totalEventsHosted || 0,
          totalGuestsServed: (hostProfile as any).totalGuestsServed || 0,
          totalRevenue: (hostProfile as any).totalRevenue || 0,
          isIdentityVerified: (hostProfile as any).isIdentityVerified || false,
          governmentIdPath: (hostProfile as any).governmentIdPath || "",
          isCulinaryCertified: (hostProfile as any).isCulinaryCertified || false,
          verificationDate: (hostProfile as any).verificationDate || null
        }
      : undefined,
    guestProfile: guestProfile
      ? {
          guestType: (guestProfile as any).guestType || "BASIC",
          totalBookings: bookings.length,
          totalSpent: bookings.reduce((sum, b: any) => sum + ((b.amountTotal || 0) * (b.status === "CONFIRMED" ? 1 : 0)), 0)
        }
      : undefined,
    bookings: bookings.map((b: any) => {
      const event = b.eventSlotId as any;
      return {
        _id: String(b._id),
        eventName: event?.eventName || "N/A",
        eventDate: event?.startAt || b.createdAt,
        seats: b.seats,
        amountTotal: b.amountTotal,
        status: b.status
      };
    }),
    events,
    reviews: reviews.map((r: any) => {
      const event = r.eventSlotId as any;
      return {
        _id: String(r._id),
        eventName: event?.eventName || "N/A",
        rating: r.rating,
        comment: r.comment || "",
        feedbackType: r.feedbackType,
        createdAt: r.createdAt
      };
    })
  };
}

// ==========================================
// EVENT MODERATION
// ==========================================

export async function approveEvent(
  eventId: string,
  adminId: string,
  adminUsername: string
): Promise<void> {
  await connectMongo();

  const event = await EventSlot.findById(eventId);
  if (!event) throw new Error("Event not found");

  (event as any).status = "OPEN";
  await event.save();

  await AdminAction.create({
    adminUserId: adminId,
    adminUsername,
    actionType: "APPROVE_EVENT",
    targetType: "EVENT",
    targetId: eventId,
    description: `Approved event ${eventId}`
  });
}

export async function rejectEvent(
  eventId: string,
  adminId: string,
  adminUsername: string,
  reason?: string
): Promise<void> {
  await connectMongo();

  const event = await EventSlot.findById(eventId);
  if (!event) throw new Error("Event not found");

  (event as any).status = "CANCELLED";
  await event.save();

  await AdminAction.create({
    adminUserId: adminId,
    adminUsername,
    actionType: "REJECT_EVENT",
    targetType: "EVENT",
    targetId: eventId,
    metadata: { reason },
    description: `Rejected event ${eventId}${reason ? `: ${reason}` : ""}`
  });
}

export async function cancelEventByAdmin(
  eventId: string,
  adminId: string,
  adminUsername: string,
  reason?: string
): Promise<void> {
  await connectMongo();

  const event = await EventSlot.findById(eventId);
  if (!event) throw new Error("Event not found");

  (event as any).status = "CANCELLED";
  await event.save();

  // Cancel all bookings and mark for refund
  await Booking.updateMany(
    { eventSlotId: eventId, status: { $in: ["PAYMENT_PENDING", "CONFIRMED"] } },
    { status: "CANCELLED" }
  );

  await AdminAction.create({
    adminUserId: adminId,
    adminUsername,
    actionType: "CANCEL_EVENT",
    targetType: "EVENT",
    targetId: eventId,
    metadata: { reason },
    description: `Cancelled event ${eventId}${reason ? `: ${reason}` : ""}`
  });
}

// ==========================================
// VENUES MANAGEMENT
// ==========================================

export interface VenueListItem {
  _id: string;
  name: string;
  address: string;
  locality: string;
  hostUserId: string;
  hostName: string;
  hostEmail: string;
  foodCategories: string[];
  gamesAvailable: string[];
  createdAt: Date;
}

export async function listVenues(filters: {
  hostUserId?: string;
  locality?: string;
  page?: number;
  limit?: number;
}): Promise<{ venues: VenueListItem[]; total: number }> {
  await connectMongo();

  const page = filters.page || 1;
  const limit = filters.limit || 20;
  const skip = (page - 1) * limit;

  const query: any = {};
  if (filters.hostUserId) query.hostUserId = filters.hostUserId;
  if (filters.locality) query.locality = { $regex: filters.locality, $options: "i" };

  const total = await Venue.countDocuments(query);
  const venues = await Venue.find(query)
    .populate("hostUserId", "email")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  const hostUserIds = [...new Set(venues.map((v: any) => String(v.hostUserId?._id || v.hostUserId)))];
  const hostProfiles = await HostProfile.find({ userId: { $in: hostUserIds } }).lean();
  const hostNameMap = new Map();
  hostProfiles.forEach((hp: any) => {
    const name = `${hp.firstName || ""} ${hp.lastName || ""}`.trim();
    if (name) hostNameMap.set(String(hp.userId), name);
  });

  const venuesWithDetails: VenueListItem[] = venues.map((v: any) => {
    const hostUser = v.hostUserId as any;
    const hostUserIdStr = String(hostUser?._id || v.hostUserId);

    return {
      _id: String(v._id),
      name: v.name,
      address: v.address,
      locality: v.locality || "",
      hostUserId: hostUserIdStr,
      hostName: hostNameMap.get(hostUserIdStr) || "N/A",
      hostEmail: hostUser?.email || "",
      foodCategories: v.foodCategories || [],
      gamesAvailable: v.gamesAvailable || [],
      createdAt: v.createdAt
    };
  });

  return { venues: venuesWithDetails, total };
}

// ==========================================
// PLATFORM SETTINGS
// ==========================================

export interface PlatformSettings {
  hostRegistrationFee: number;
  platformCommissionRate: number;
  minEventPrice: number;
  maxEventPrice: number;
  maxGuestsPerEvent: number;
  refundPolicy: string;
  cancellationPolicy: string;
}

let cachedSettings: PlatformSettings = {
  hostRegistrationFee: HOST_REGISTRATION_FEE,
  platformCommissionRate: PLATFORM_COMMISSION_RATE,
  minEventPrice: 0,
  maxEventPrice: 10000000, // 100,000 INR
  maxGuestsPerEvent: 50,
  refundPolicy: "Full refund if cancelled 48 hours before event",
  cancellationPolicy: "Hosts can cancel events up to 24 hours before start time"
};

export async function getPlatformSettings(): Promise<PlatformSettings> {
  return cachedSettings;
}

export async function updatePlatformSettings(
  settings: Partial<PlatformSettings>,
  adminId: string,
  adminUsername: string
): Promise<PlatformSettings> {
  cachedSettings = { ...cachedSettings, ...settings };

  await AdminAction.create({
    adminUserId: adminId,
    adminUsername,
    actionType: "UPDATE_SETTINGS",
    targetType: "SETTINGS",
    metadata: { settings },
    description: `Updated platform settings`
  });

  return cachedSettings;
}

// ==========================================
// ADMIN USER MANAGEMENT
// ==========================================

export interface AdminListItem {
  _id: string;
  username: string;
  email: string;
  fullName: string;
  role: string;
  isActive: boolean;
  lastLoginAt: Date | null;
  createdAt: Date;
}

export async function listAdmins(): Promise<AdminListItem[]> {
  await connectMongo();

  const admins = await Admin.find({})
    .select("-passwordHash")
    .sort({ createdAt: -1 })
    .lean();

  return admins.map((a: any) => ({
    _id: String(a._id),
    username: a.username,
    email: a.email,
    fullName: a.fullName,
    role: a.role,
    isActive: a.isActive ?? true,
    lastLoginAt: a.lastLoginAt || null,
    createdAt: a.createdAt
  }));
}

// ==========================================
// AUDIT LOGS
// ==========================================

export interface AuditLogItem {
  _id: string;
  adminUserId: string;
  adminUsername: string;
  actionType: string;
  targetType: string;
  targetId: string | null;
  description: string;
  metadata: any;
  createdAt: Date;
}

export async function listAuditLogs(filters: {
  adminUserId?: string;
  actionType?: string;
  targetType?: string;
  page?: number;
  limit?: number;
}): Promise<{ logs: AuditLogItem[]; total: number }> {
  await connectMongo();

  const page = filters.page || 1;
  const limit = filters.limit || 50;
  const skip = (page - 1) * limit;

  const query: any = {};
  if (filters.adminUserId) query.adminUserId = filters.adminUserId;
  if (filters.actionType) query.actionType = filters.actionType;
  if (filters.targetType) query.targetType = filters.targetType;

  const total = await AdminAction.countDocuments(query);
  const logs = await AdminAction.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  return {
    logs: logs.map((l: any) => ({
      _id: String(l._id),
      adminUserId: String(l.adminUserId),
      adminUsername: l.adminUsername || "Unknown",
      actionType: l.actionType,
      targetType: l.targetType || "USER",
      targetId: l.targetId ? String(l.targetId) : null,
      description: l.description || "",
      metadata: l.metadata || {},
      createdAt: l.createdAt
    })),
    total
  };
}
