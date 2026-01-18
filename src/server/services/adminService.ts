import { connectMongo } from "@/server/db/mongoose";
import { User } from "@/server/models/User";
import { HostProfile } from "@/server/models/HostProfile";
import { GuestProfile } from "@/server/models/GuestProfile";
import { EventSlot } from "@/server/models/EventSlot";
import { Booking } from "@/server/models/Booking";
import { Payment } from "@/server/models/Payment";
import { Venue } from "@/server/models/Venue";
import { AdminAction } from "@/server/models/AdminAction";
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
  adminUserId: string
): Promise<void> {
  await connectMongo();

  const user = await User.findById(userId);
  if (!user) throw new Error("User not found");

  const oldStatus = user.status;
  user.status = status;
  await user.save();

  // Log admin action
  await AdminAction.create({
    adminUserId,
    actionType: "UPDATE_USER_STATUS",
    targetUserId: userId,
    metadata: { oldStatus, newStatus: status }
  });
}

export async function verifyUser(userId: string, adminUserId: string): Promise<void> {
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
    adminUserId,
    actionType: "VERIFY_USER",
    targetUserId: userId,
    metadata: { role: user.role }
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
    description: string;
    foodCategories: string[];
    gamesAvailable: string[];
    images: Array<{ filePath: string; fileMime: string; fileName: string; uploadedAt: Date }>;
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
          description: venue.description || "",
          foodCategories: venue.foodCategories || [],
          gamesAvailable: venue.gamesAvailable || [],
          images: venue.images || []
        }
      : {
          _id: "",
          name: "",
          address: "",
          locality: "",
          description: "",
          foodCategories: [],
          gamesAvailable: [],
          images: []
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
