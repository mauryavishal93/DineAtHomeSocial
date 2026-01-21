import { NextRequest } from "next/server";
import { requireAuth } from "@/server/auth/rbac";
import { connectMongo } from "@/server/db/mongoose";
import { EventPass } from "@/server/models/EventPass";
import { getEventPassById } from "@/server/services/eventPassService";
import { createResponse } from "@/server/http/response";

export const runtime = "nodejs";

// Get event pass details by pass ID
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ passId: string }> }
) {
  try {
    const ctx = await requireAuth(req);
    await connectMongo();
    const { passId } = await params;

    const pass = await getEventPassById(passId);
    if (!pass) {
      return createResponse({ error: "Event pass not found" }, { status: 404 });
    }

    // Verify ownership (guest can view their own pass)
    const passDoc = await EventPass.findById(passId).lean();
    if (!passDoc) {
      return createResponse({ error: "Event pass not found" }, { status: 404 });
    }

    if (String((passDoc as any).guestUserId) !== String(ctx.userId)) {
      return createResponse({ error: "Unauthorized" }, { status: 403 });
    }

    return createResponse({ pass });
  } catch (error: any) {
    return createResponse({ error: error.message }, { status: 401 });
  }
}
