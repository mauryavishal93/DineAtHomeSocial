import { ok, badRequest, serverError } from "@/server/http/response";

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const address = searchParams.get("address");

    if (!address) {
      return badRequest("Address parameter is required");
    }

    // Use a free geocoding service (Nominatim/OpenStreetMap)
    // This doesn't require an API key
    const encodedAddress = encodeURIComponent(address.trim());
    
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddress}&limit=1&addressdetails=1`,
        {
          headers: {
            "User-Agent": "DineAtHomeSocial/1.0 (contact@dineathomesocial.com)" // Required by Nominatim
          }
        }
      );

      if (!response.ok) {
        console.error("Nominatim API error:", response.status, response.statusText);
        return serverError(`Geocoding service error: ${response.statusText}`);
      }

      const data = await response.json();

      if (data && Array.isArray(data) && data.length > 0) {
        const result = data[0];
        const addr = result.address || {};
        
        // Extract structured address components with multiple fallbacks
        const formattedAddress = result.display_name || address;
        const city = addr.city || addr.town || addr.village || addr.city_district || addr.county || "";
        const state = addr.state || addr.region || addr.state_district || "";
        const country = addr.country || "";
        const postalCode = addr.postcode || "";
        const locality = addr.suburb || addr.neighbourhood || addr.locality || addr.city_district || city || "";
        
        // Validate coordinates
        const lat = parseFloat(result.lat);
        const lon = parseFloat(result.lon);
        
        if (isNaN(lat) || isNaN(lon)) {
          return badRequest("Invalid coordinates returned from geocoding service");
        }
        
        return ok({
          latitude: lat,
          longitude: lon,
          formattedAddress,
          city,
          state,
          country,
          postalCode,
          locality
        });
      }

      // If no results, try a more flexible search
      console.warn("No results found for address:", address);
      return badRequest(`Address not found. Please try a more specific address or include city/state.`);
    } catch (fetchError) {
      console.error("Geocoding fetch error:", fetchError);
      const errorMsg = fetchError instanceof Error ? fetchError.message : "Unknown error";
      return serverError(`Failed to connect to geocoding service: ${errorMsg}`);
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return serverError(`Geocoding failed: ${msg}`);
  }
}
