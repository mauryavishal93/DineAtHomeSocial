import { NextRequest } from "next/server";
import { requireAuth } from "@/server/auth/rbac";
import { connectMongo } from "@/server/db/mongoose";
import { Booking } from "@/server/models/Booking";
import { createResponse } from "@/server/http/response";

export const runtime = "nodejs";

type EcdhJwk = Record<string, unknown>;

function isPlainObject(v: unknown): v is EcdhJwk {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

/** GET: public keys for ECDH handshake (E2E chat). */
export async function GET(req: NextRequest) {
  try {
    const ctx = await requireAuth(req);
    await connectMongo();

    const bookingId = new URL(req.url).searchParams.get("bookingId");
    if (!bookingId) {
      return createResponse({ error: "bookingId is required" }, { status: 400 });
    }

    const booking = await Booking.findById(bookingId).lean();
    if (!booking) {
      return createResponse({ error: "Booking not found" }, { status: 404 });
    }

    const b = booking as any;
    const isGuest = String(b.guestUserId) === String(ctx.userId);
    const isHost = String(b.hostUserId) === String(ctx.userId);
    if (!isGuest && !isHost) {
      return createResponse({ error: "Access denied" }, { status: 403 });
    }

    return createResponse({
      bookingId: String(bookingId),
      guestPublicJwk: b.chatGuestEcdhPublicJwk ?? null,
      hostPublicJwk: b.chatHostEcdhPublicJwk ?? null,
      ready: !!(b.chatGuestEcdhPublicJwk && b.chatHostEcdhPublicJwk)
    });
  } catch (error: any) {
    return createResponse({ error: error.message }, { status: 401 });
  }
}

/** POST: upload this user's ECDH public JWK (P-256). */
export async function POST(req: NextRequest) {
  try {
    const ctx = await requireAuth(req);
    await connectMongo();

    const body = await req.json();
    const { bookingId, publicJwk } = body;

    if (!bookingId || !publicJwk || !isPlainObject(publicJwk)) {
      return createResponse({ error: "bookingId and publicJwk are required" }, { status: 400 });
    }

    const kty = publicJwk.kty;
    const crv = publicJwk.crv;
    if (kty !== "EC" || crv !== "P-256" || typeof publicJwk.x !== "string" || typeof publicJwk.y !== "string") {
      return createResponse({ error: "Invalid ECDH public key (expected P-256 JWK)" }, { status: 400 });
    }

    const booking = await Booking.findById(bookingId).lean();
    if (!booking) {
      return createResponse({ error: "Booking not found" }, { status: 404 });
    }

    const b = booking as any;
    const isGuest = String(b.guestUserId) === String(ctx.userId);
    const isHost = String(b.hostUserId) === String(ctx.userId);
    if (!isGuest && !isHost) {
      return createResponse({ error: "Access denied" }, { status: 403 });
    }

    const field = isGuest ? "chatGuestEcdhPublicJwk" : "chatHostEcdhPublicJwk";
    await Booking.updateOne({ _id: bookingId }, { $set: { [field]: publicJwk } });

    const updated = await Booking.findById(bookingId).lean() as any;
    return createResponse({
      success: true,
      guestPublicJwk: updated.chatGuestEcdhPublicJwk ?? null,
      hostPublicJwk: updated.chatHostEcdhPublicJwk ?? null,
      ready: !!(updated.chatGuestEcdhPublicJwk && updated.chatHostEcdhPublicJwk)
    });
  } catch (error: any) {
    return createResponse({ error: error.message }, { status: 401 });
  }
}
