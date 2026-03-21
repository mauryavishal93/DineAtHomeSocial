/**
 * Raster tiles for Leaflet {@link https://leafletjs.com/}
 * — Default basemap: **CARTO light** (same pattern as vanilla `L.tileLayer` samples).
 * — OSM raster tiles kept as an alternative.
 */
export const LEAFLET_OSM_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright" rel="noreferrer">OpenStreetMap</a> contributors';

export const LEAFLET_OSM_TILE_URL = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";

/** CARTO Positron (light) — `subdomains: abcd`, `{r}` for retina in the URL template */
export const LEAFLET_CARTO_LIGHT_TILE_URL =
  "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png";

export const LEAFLET_CARTO_LIGHT_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright" rel="noreferrer">OpenStreetMap</a> ' +
  '&copy; <a href="https://carto.com/attributions" rel="noreferrer">CARTO</a>';

/** Used by {@link AddressMap} and other embedded maps */
export const LEAFLET_DEFAULT_TILE_URL = LEAFLET_CARTO_LIGHT_TILE_URL;
export const LEAFLET_DEFAULT_ATTRIBUTION = LEAFLET_CARTO_LIGHT_ATTRIBUTION;
