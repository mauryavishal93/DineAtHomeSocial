import { ok, serverError } from "@/server/http/response";
import { listPublicEvents } from "@/server/services/eventService";
// Ensure all models are registered before queries
import "@/server/models/Venue";
import "@/server/models/HostProfile";
import "@/server/models/User";

export const runtime = "nodejs";

// Disable caching to ensure events appear immediately after posting
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const data = await listPublicEvents();
    return ok(data, {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        "Pragma": "no-cache",
        "Expires": "0"
      }
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed";
    return serverError(msg);
  }
}

