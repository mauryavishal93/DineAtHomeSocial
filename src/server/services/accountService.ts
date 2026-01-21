import { connectMongo } from "@/server/db/mongoose";
import { User } from "@/server/models/User";
import { GuestProfile } from "@/server/models/GuestProfile";
import { HostProfile } from "@/server/models/HostProfile";
import { Booking } from "@/server/models/Booking";
import { Feedback } from "@/server/models/Feedback";

type DisplayUser = {
  userId: string;
  email: string;
  role: "ADMIN" | "HOST" | "GUEST";
  displayName: string;
};

export async function getMe(userId: string): Promise<DisplayUser & { profile?: any }> {
  await connectMongo();
  const user = (await User.findById(userId).lean()) as
    | { _id: unknown; email: string; role: "ADMIN" | "HOST" | "GUEST"; mobile?: string }
    | null;
  if (!user) throw new Error("User not found");

  let displayName = user.email;
  let profile = null;
  
  if (user.role === "GUEST") {
    const gp = (await GuestProfile.findOne({ userId: user._id }).lean()) as
      | { firstName?: string; lastName?: string; age?: number; gender?: string }
      | null;
    if (gp) {
      const name = `${gp.firstName ?? ""} ${gp.lastName ?? ""}`.trim();
      if (name) displayName = name;
      
      profile = {
        firstName: gp.firstName || "",
        lastName: gp.lastName || "",
        age: gp.age || 25,
        gender: gp.gender || "Male",
        mobile: user.mobile || ""
      };
    }
  }
  if (user.role === "HOST") {
    const hp = (await HostProfile.findOne({ userId: user._id }).lean()) as
      | { firstName?: string; lastName?: string }
      | null;
    if (hp) {
      const name = `${hp.firstName ?? ""} ${hp.lastName ?? ""}`.trim();
      if (name) displayName = name;
    }
  }

  return {
    userId: String(user._id),
    email: user.email,
    role: user.role,
    displayName,
    profile
  };
}

export async function getGuestAccountOverview(userId: string) {
  await connectMongo();

  const me = await getMe(userId);
  if (me.role !== "GUEST") throw new Error("Forbidden");

  const profile = (await GuestProfile.findOne({ userId }).lean()) as
    | {
        firstName?: string;
        lastName?: string;
        age?: number;
        gender?: string;
        bio?: string;
        interests?: string[];
        ratingAvg?: number;
        ratingCount?: number;
      }
    | null;
  const profileView = {
    name: `${profile?.firstName ?? ""} ${profile?.lastName ?? ""}`.trim(),
    age: profile?.age ?? 0,
    gender: profile?.gender ?? "",
    bio: profile?.bio ?? "",
    interests: profile?.interests ?? [],
    ratingAvg: profile?.ratingAvg ?? 0,
    ratingCount: profile?.ratingCount ?? 0
  };

  const bookings = await Booking.find({
    guestUserId: userId,
    status: { $in: ["CONFIRMED", "PAYMENT_PENDING"] }
  })
    .sort({ createdAt: -1 })
    .limit(50)
    .populate({ path: "eventSlotId", select: "eventName startAt endAt status venueId" })
    .populate({ path: "venueId", select: "name locality address" })
    .lean();

  const attendedEvents = bookings.map((b) => {
    const event = b.eventSlotId as unknown as {
      _id: unknown;
      eventName?: string;
      startAt?: Date;
      endAt?: Date;
      status?: string;
    } | null;
    const venue = b.venueId as unknown as {
      _id: unknown;
      name?: string;
      locality?: string;
      address?: string;
    } | null;

    return {
      bookingId: String(b._id),
      eventSlotId: event?._id ? String(event._id) : String(b.eventSlotId),
      eventName: event?.eventName ?? "",
      startAt: event?.startAt ?? null,
      endAt: event?.endAt ?? null,
      eventStatus: event?.status ?? "",
      venueName: venue?.name ?? "",
      venueLocality: venue?.locality ?? "",
      seats: b.seats ?? 1,
      amountTotal: b.amountTotal ?? 0,
      bookedAt: b.createdAt ?? null
    };
  });

  const feedbacks = await Feedback.find({ fromUserId: userId })
    .sort({ createdAt: -1 })
    .limit(200)
    .populate({ path: "eventSlotId", select: "eventName startAt" })
    .populate({ path: "toUserId", select: "email role" })
    .lean();

  const targetIds = Array.from(
    new Set(
      feedbacks
        .map((f) => {
          const tu = f.toUserId as unknown as { _id?: unknown } | string;
          if (!tu) return null;
          if (typeof tu === "string") return tu;
          return tu._id ? String(tu._id) : null;
        })
        .filter(Boolean) as string[]
    )
  );

  const guestTargets = await GuestProfile.find({ userId: { $in: targetIds } })
    .select({ userId: 1, firstName: 1, lastName: 1 })
    .lean();
  const hostTargets = await HostProfile.find({ userId: { $in: targetIds } })
    .select({ userId: 1, name: 1 })
    .lean();

  const nameByUserId = new Map<string, string>();
  for (const g of guestTargets) {
    const name = `${g.firstName ?? ""} ${g.lastName ?? ""}`.trim();
    if (name) nameByUserId.set(String(g.userId), name);
  }
  for (const h of hostTargets) {
    if (h.name) nameByUserId.set(String(h.userId), h.name);
  }

  const feedbackGiven = feedbacks.map((f) => {
    const toUser = f.toUserId as unknown as { _id?: unknown; email?: string } | string;
    const toUserIdStr =
      typeof toUser === "string" ? toUser : toUser?._id ? String(toUser._id) : "";

    const ev = f.eventSlotId as unknown as { _id?: unknown; eventName?: string; startAt?: Date };
    const eventName = ev?.eventName ?? "";

    return {
      feedbackId: String(f._id),
      eventSlotId: ev?._id ? String(ev._id) : String(f.eventSlotId),
      eventName,
      eventStartAt: ev?.startAt ?? null,
      toUserId: toUserIdStr,
      toUserName: nameByUserId.get(toUserIdStr) ?? (typeof toUser === "string" ? "" : toUser?.email ?? ""),
      rating: f.rating ?? 0,
      comment: f.comment ?? "",
      createdAt: f.createdAt ?? null
    };
  });

  return { me, profile: profileView, attendedEvents, feedbackGiven };
}

