import { ok, badRequest, serverError } from "@/server/http/response";

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const address = searchParams.get("address");
    const latitude = searchParams.get("latitude");
    const longitude = searchParams.get("longitude");

    // Reverse geocoding: coordinates to address
    if (latitude && longitude) {
      const lat = parseFloat(latitude);
      const lon = parseFloat(longitude);
      
      if (isNaN(lat) || isNaN(lon)) {
        return badRequest("Invalid latitude or longitude");
      }

      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`,
          {
            headers: {
              "User-Agent": "DineAtHomeSocial/1.0 (contact@dineathomesocial.com)"
            }
          }
        );

        if (!response.ok) {
          console.error("Nominatim reverse geocoding error:", response.status, response.statusText);
          return serverError(`Reverse geocoding service error: ${response.statusText}`);
        }

        const data = await response.json();

        if (data && data.address) {
          const addr = data.address || {};
          const formattedAddress = data.display_name || `Location at ${lat.toFixed(6)}, ${lon.toFixed(6)}`;
          const city = addr.city || addr.town || addr.village || addr.city_district || addr.county || "";
          const state = addr.state || addr.region || addr.state_district || "";
          const country = addr.country || "";
          const postalCode = addr.postcode || "";
          const locality = addr.suburb || addr.neighbourhood || addr.locality || addr.city_district || city || "";

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

        return badRequest("Could not find address for the given coordinates");
      } catch (fetchError) {
        console.error("Reverse geocoding fetch error:", fetchError);
        const errorMsg = fetchError instanceof Error ? fetchError.message : "Unknown error";
        return serverError(`Failed to connect to reverse geocoding service: ${errorMsg}`);
      }
    }

    // Forward geocoding: address to coordinates
    if (!address) {
      return badRequest("Address parameter is required for forward geocoding");
    }

    // Use Nominatim geocoding service (free, no API key required)
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

      // If no results, try a more flexible search with different strategies
      console.warn("No results found for address:", address);
      
      // Try a more flexible search with country hint (India)
      try {
        const flexibleResponse = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddress}&limit=5&addressdetails=1&countrycodes=in`,
          {
            headers: {
              "User-Agent": "DineAtHomeSocial/1.0 (contact@dineathomesocial.com)"
            }
          }
        );

        if (flexibleResponse.ok) {
          const flexibleData = await flexibleResponse.json();
          if (flexibleData && Array.isArray(flexibleData) && flexibleData.length > 0) {
            const result = flexibleData[0];
            const addr = result.address || {};
            
            const formattedAddress = result.display_name || address;
            const city = addr.city || addr.town || addr.village || addr.city_district || addr.county || "";
            const state = addr.state || addr.region || addr.state_district || "";
            const country = addr.country || "";
            const postalCode = addr.postcode || "";
            const locality = addr.suburb || addr.neighbourhood || addr.locality || addr.city_district || city || "";
            
            const lat = parseFloat(result.lat);
            const lon = parseFloat(result.lon);
            
            if (!isNaN(lat) && !isNaN(lon)) {
              console.log("Found address with flexible search");
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
          }
        }
      } catch (flexibleError) {
        console.warn("Flexible geocoding search failed:", flexibleError);
      }
      
      return badRequest(`Address not found. Please try a more specific address or include city/state. You can also click on the map to select a location manually.`);
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
