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

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    
    // Get all values for array parameters (multiple selections)
    const cities = searchParams.getAll("city").filter(Boolean);
    const localities = searchParams.getAll("locality").filter(Boolean);
    const states = searchParams.getAll("state").filter(Boolean);
    const cuisines = searchParams.getAll("cuisine").filter(Boolean);
    const interests = searchParams.getAll("interest").filter(Boolean);
    const dietary = searchParams.getAll("dietary").filter(Boolean);
    const activities = searchParams.getAll("activity").filter(Boolean);
    
    const minPrice = searchParams.get("minPrice") ? parseInt(searchParams.get("minPrice")!) : undefined;
    const maxPrice = searchParams.get("maxPrice") ? parseInt(searchParams.get("maxPrice")!) : undefined;
    const foodTag = searchParams.get("foodTag") || undefined;
    const minRating = searchParams.get("minRating") ? parseFloat(searchParams.get("minRating")!) : undefined;
    const dateFrom = searchParams.get("dateFrom") || undefined;
    const dateTo = searchParams.get("dateTo") || undefined;
    
    const filters = {
      cities: cities.length > 0 ? cities : undefined,
      localities: localities.length > 0 ? localities : undefined,
      states: states.length > 0 ? states : undefined,
      cuisines: cuisines.length > 0 ? cuisines : undefined,
      interests: interests.length > 0 ? interests : undefined,
      dietary: dietary.length > 0 ? dietary : undefined,
      activities: activities.length > 0 ? activities : undefined,
      minPrice,
      maxPrice,
      foodTag,
      minRating,
      dateFrom,
      dateTo
    };
    
    const data = await listPublicEvents(filters);
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

