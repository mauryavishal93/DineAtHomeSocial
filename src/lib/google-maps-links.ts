/**
 * External links to **Google Maps** (place search + directions).
 * Embedded maps in the app stay Leaflet/OSM; these are outbound links only.
 *
 * @see https://developers.google.com/maps/documentation/urls/get-started
 */
import { isValidLatLng } from "./geo";

/** Open the venue in Google Maps (coordinates or text search). */
export function googleMapsVenueUrl(params: {
  latitude?: number | null;
  longitude?: number | null;
  addressQuery?: string;
}): string {
  const { latitude, longitude, addressQuery } = params;
  if (isValidLatLng(latitude, longitude)) {
    const lat = latitude as number;
    const lng = longitude as number;
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${lat},${lng}`)}`;
  }
  const addr = addressQuery?.trim();
  if (addr) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addr)}`;
  }
  return "https://www.google.com/maps";
}

/**
 * Google Maps directions with destination = venue (user picks starting point in the app).
 * Uses coordinates when available; otherwise the combined address string.
 */
export function googleMapsDirectionsUrl(params: {
  latitude?: number | null;
  longitude?: number | null;
  addressQuery?: string;
}): string | null {
  const { latitude, longitude, addressQuery } = params;
  if (isValidLatLng(latitude, longitude)) {
    const lat = latitude as number;
    const lng = longitude as number;
    return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${lat},${lng}`)}`;
  }
  const addr = addressQuery?.trim();
  if (addr) {
    return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(addr)}`;
  }
  return null;
}
