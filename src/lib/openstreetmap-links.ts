/**
 * External links to openstreetmap.org (same ecosystem as Leaflet + OSM tiles).
 * No Google Maps — embedded maps use Leaflet via `@/components/map`.
 */

import { isValidLatLng } from "./geo";

export { isValidLatLng } from "./geo";

export function buildVenueAddressQuery(parts: Array<string | undefined | null>): string {
  return parts.filter((p) => typeof p === "string" && p.trim().length > 0).join(", ");
}

/** Open the venue pin or search on OpenStreetMap in a new tab. */
export function openStreetMapVenueUrl(params: {
  latitude?: number | null;
  longitude?: number | null;
  /** Used when coordinates are missing */
  addressQuery?: string;
}): string {
  const { latitude, longitude, addressQuery } = params;
  if (isValidLatLng(latitude, longitude)) {
    const lat = latitude as number;
    const lng = longitude as number;
    return `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=16/${lat}/${lng}`;
  }
  const addr = addressQuery?.trim();
  if (addr) {
    return `https://www.openstreetmap.org/search?query=${encodeURIComponent(addr)}`;
  }
  return "https://www.openstreetmap.org";
}

/**
 * Open OSM directions with destination set to the venue (user chooses start on the site).
 * Same UX as “Get directions” on listing sites; uses OSM’s built-in router.
 */
export function openStreetMapDirectionsUrl(params: {
  latitude?: number | null;
  longitude?: number | null;
}): string | null {
  const { latitude, longitude } = params;
  if (!isValidLatLng(latitude, longitude)) return null;
  const lat = latitude as number;
  const lng = longitude as number;
  const route = `;${lat},${lng}`;
  return `https://www.openstreetmap.org/directions?engine=fossgis_osrm_car&route=${encodeURIComponent(route)}`;
}
