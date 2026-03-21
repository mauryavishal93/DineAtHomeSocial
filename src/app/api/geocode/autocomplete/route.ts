import { ok, badRequest, serverError } from "@/server/http/response";

export const runtime = "nodejs";

/** Nominatim search — multiple results for address dropdown (respect usage policy; client debounces). */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q")?.trim() ?? "";
    const limitRaw = searchParams.get("limit");
    const limit = Math.min(10, Math.max(1, parseInt(limitRaw || "6", 10) || 6));

    if (q.length < 3) {
      return ok({ suggestions: [] });
    }
    if (q.length > 200) {
      return badRequest("Query too long");
    }

    const encoded = encodeURIComponent(q);
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encoded}&limit=${limit}&addressdetails=1`;

    const response = await fetch(url, {
      headers: {
        "User-Agent": "DineAtHomeSocial/1.0 (contact@dineathomesocial.com)"
      }
    });

    if (!response.ok) {
      console.error("Nominatim autocomplete error:", response.status, response.statusText);
      return serverError("Address search temporarily unavailable");
    }

    const data = (await response.json()) as Array<{
      place_id?: number;
      lat: string;
      lon: string;
      display_name?: string;
      address?: Record<string, string>;
    }>;

    if (!Array.isArray(data)) {
      return ok({ suggestions: [] });
    }

    const suggestions = data.map((result, index) => {
      const addr = result.address || {};
      const lat = parseFloat(result.lat);
      const lon = parseFloat(result.lon);
      const city =
        addr.city || addr.town || addr.village || addr.city_district || addr.county || "";
      const state = addr.state || addr.region || addr.state_district || "";
      const country = addr.country || "";
      const postalCode = addr.postcode || "";
      const locality =
        addr.suburb || addr.neighbourhood || addr.locality || addr.city_district || city || "";

      return {
        id: result.place_id != null ? `p${result.place_id}` : `i${index}-${lat}-${lon}`,
        displayName: result.display_name || `${lat}, ${lon}`,
        latitude: lat,
        longitude: lon,
        locality,
        city,
        state,
        country,
        postalCode
      };
    }).filter((s) => Number.isFinite(s.latitude) && Number.isFinite(s.longitude));

    return ok({ suggestions });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return serverError(`Autocomplete failed: ${msg}`);
  }
}
