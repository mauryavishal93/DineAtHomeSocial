import { NextRequest } from "next/server";
import { requireAuth } from "@/server/auth/rbac";
import { connectMongo } from "@/server/db/mongoose";
import { Favorite } from "@/server/models/Favorite";
import { EventSlot } from "@/server/models/EventSlot";
import { User } from "@/server/models/User";
import { HostProfile } from "@/server/models/HostProfile";
import { createResponse } from "@/server/http/response";

export async function GET(req: NextRequest) {
  try {
    const ctx = await requireAuth(req);
    await connectMongo();

    const url = new URL(req.url);
    const favoriteType = url.searchParams.get("type") as "EVENT" | "HOST" | null;

    const query: any = { userId: ctx.userId };
    if (favoriteType) {
      query.favoriteType = favoriteType;
    }

    const favorites = await Favorite.find(query)
      .sort({ createdAt: -1 })
      .lean();

    // Populate event or host details
    const favoritesWithDetails = await Promise.all(
      favorites.map(async (fav: any) => {
        if (fav.favoriteType === "EVENT" && fav.eventId) {
          const event = await EventSlot.findById(fav.eventId)
            .populate({ path: "venueId", select: "name address locality" })
            .populate({ path: "hostUserId", select: "name" })
            .lean();
          
          if (!event) return null;
          
          return {
            id: String(fav._id),
            favoriteType: "EVENT",
            eventId: String(fav.eventId),
            event: {
              id: String((event as any)._id),
              title: (event as any).eventName,
              startAt: (event as any).startAt,
              endAt: (event as any).endAt,
              venueName: (event as any).venueId?.name,
              venueAddress: (event as any).venueId?.address,
              hostName: (event as any).hostUserId?.name,
              priceFrom: Math.round(((event as any).basePricePerGuest || 0) / 100), // Convert paise to rupees
              seatsLeft: (event as any).seatsRemaining || 0
            },
            createdAt: fav.createdAt
          };
        } else if (fav.favoriteType === "HOST" && fav.hostUserId) {
          const host = await User.findById(fav.hostUserId).lean();
          const hostProfile = await HostProfile.findOne({ userId: fav.hostUserId }).lean();
          
          if (!host) return null;
          
          return {
            id: String(fav._id),
            favoriteType: "HOST",
            hostUserId: String(fav.hostUserId),
            host: {
              id: String((host as any)._id),
              name: (host as any).name,
              rating: (hostProfile as any)?.ratingAvg || 0,
              ratingCount: (hostProfile as any)?.ratingCount || 0,
              venueName: (hostProfile as any)?.venueName,
              locality: (hostProfile as any)?.locality
            },
            createdAt: fav.createdAt
          };
        }
        return null;
      })
    );

    return createResponse({
      favorites: favoritesWithDetails.filter(Boolean)
    });
  } catch (error: any) {
    return createResponse({ error: error.message }, { status: 401 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const ctx = await requireAuth(req);
    await connectMongo();

    const body = await req.json();
    const { favoriteType, eventId, hostUserId } = body;

    if (!favoriteType || (favoriteType === "EVENT" && !eventId) || (favoriteType === "HOST" && !hostUserId)) {
      return createResponse({ error: "Invalid request" }, { status: 400 });
    }

    // Check if already favorited
    const existing = await Favorite.findOne({
      userId: ctx.userId,
      favoriteType,
      ...(favoriteType === "EVENT" ? { eventId } : { hostUserId })
    });

    if (existing) {
      return createResponse({ error: "Already favorited" }, { status: 400 });
    }

    const favorite = await Favorite.create({
      userId: ctx.userId,
      favoriteType,
      ...(favoriteType === "EVENT" ? { eventId } : { hostUserId })
    });

    return createResponse({
      success: true,
      favoriteId: String(favorite._id)
    });
  } catch (error: any) {
    if (error.code === 11000) {
      return createResponse({ error: "Already favorited" }, { status: 400 });
    }
    return createResponse({ error: error.message }, { status: 401 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const ctx = await requireAuth(req);
    await connectMongo();

    const url = new URL(req.url);
    const favoriteId = url.searchParams.get("id");
    const favoriteType = url.searchParams.get("type") as "EVENT" | "HOST" | null;
    const eventId = url.searchParams.get("eventId");
    const hostUserId = url.searchParams.get("hostUserId");

    if (favoriteId) {
      await Favorite.deleteOne({ _id: favoriteId, userId: ctx.userId });
    } else if (favoriteType) {
      const query: any = { userId: ctx.userId, favoriteType };
      if (favoriteType === "EVENT" && eventId) {
        query.eventId = eventId;
      } else if (favoriteType === "HOST" && hostUserId) {
        query.hostUserId = hostUserId;
      } else {
        return createResponse({ error: "Invalid request" }, { status: 400 });
      }
      await Favorite.deleteOne(query);
    } else {
      return createResponse({ error: "Invalid request" }, { status: 400 });
    }

    return createResponse({ success: true });
  } catch (error: any) {
    return createResponse({ error: error.message }, { status: 401 });
  }
}
