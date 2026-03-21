"use client";

/**
 * Venue / event maps: **Leaflet** + **react-leaflet** (client-only; no SSR).
 * Basemap: CARTO Light (OSM data) — see `leaflet-tiles.ts` and `globals.css` (leaflet.css).
 */
import React, { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { apiFetch } from "@/lib/http";
import { isValidLatLng } from "@/lib/geo";
import {
  LEAFLET_DEFAULT_ATTRIBUTION,
  LEAFLET_DEFAULT_TILE_URL
} from "./leaflet-tiles";

// Import Leaflet types only (no runtime import to avoid SSR issues)
import type { LatLngExpression } from "leaflet";

// Dynamically import Leaflet components to avoid SSR issues - with explicit no SSR
const MapContainer = dynamic(
  () => import("react-leaflet").then((mod) => mod.MapContainer),
  { 
    ssr: false,
    loading: () => <div className="w-full h-full bg-sand-100 flex items-center justify-center text-xs text-ink-600">Loading map...</div>
  }
);
const TileLayer = dynamic(
  () => import("react-leaflet").then((mod) => mod.TileLayer),
  { ssr: false }
);
const Marker = dynamic(
  () => import("react-leaflet").then((mod) => mod.Marker),
  { ssr: false }
);
const Popup = dynamic(
  () => import("react-leaflet").then((mod) => mod.Popup),
  { ssr: false }
);

interface AddressMapProps {
  address: string;
  latitude: number | null;
  longitude: number | null;
  onLocationSelect: (
    address: string,
    lat: number,
    lng: number,
    addressComponents?: {
      locality?: string;
      city?: string;
      state?: string;
      country?: string;
      postalCode?: string;
    }
  ) => void;
  editable?: boolean;
  /** If true (view mode only), forward-geocode `address` when lat/lng are missing. */
  allowAddressGeocode?: boolean;
  /** View mode: wrapper around the Leaflet map (default `aspect-video …`). */
  mapContainerClassName?: string;
}

// Component to handle map click events - must be a separate component to use hooks
// This component is dynamically imported to avoid SSR issues
const MapClickHandler = dynamic(
  () =>
    import("react-leaflet").then((mod) => {
      const { useMapEvents } = mod;
      return function MapClickHandlerComponent({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) {
        useMapEvents({
          click: (e: any) => {
            const { lat, lng } = e.latlng;
            onMapClick(lat, lng);
          },
        });
        return null;
      };
    }),
  { ssr: false }
);

/** Like vanilla `map.setView([lat, lon], zoom)` after a pick — pans/zooms when the marker moves. */
function latLngTuple(expr: LatLngExpression | null): [number, number] | null {
  if (expr == null) return null;
  if (Array.isArray(expr)) return [Number(expr[0]), Number(expr[1])];
  const o = expr as { lat: number; lng: number };
  return [Number(o.lat), Number(o.lng)];
}

/** Leaflet measures the container on init; if layout wasn’t final yet, tiles stay blank until invalidateSize. */
const MapInvalidateSize = dynamic(
  () =>
    import("react-leaflet").then((mod) => {
      const { useMap } = mod;
      return function MapInvalidateSizeInner() {
        const map = useMap();
        useEffect(() => {
          const fix = () => {
            try {
              map.invalidateSize();
            } catch {
              /* map torn down */
            }
          };
          fix();
          const raf = requestAnimationFrame(fix);
          const t1 = setTimeout(fix, 100);
          const t2 = setTimeout(fix, 400);
          window.addEventListener("resize", fix);
          return () => {
            cancelAnimationFrame(raf);
            clearTimeout(t1);
            clearTimeout(t2);
            window.removeEventListener("resize", fix);
          };
        }, [map]);
        return null;
      };
    }),
  { ssr: false }
);

const MapFlyToMarker = dynamic(
  () =>
    import("react-leaflet").then((mod) => {
      const { useMap } = mod;
      return function MapFlyToMarkerInner({
        position,
        zoom,
      }: {
        position: LatLngExpression | null;
        zoom: number;
      }) {
        const map = useMap();
        const lastKeyRef = useRef<string>("");
        useEffect(() => {
          const t = latLngTuple(position);
          if (!t) {
            lastKeyRef.current = "";
            return;
          }
          const key = `${t[0]},${t[1]},${zoom}`;
          if (lastKeyRef.current === key) return;
          lastKeyRef.current = key;
          // Sample used setView; flyTo is smoother for repeated picks.
          map.flyTo(t, zoom, { duration: 0.45 });
        }, [map, position, zoom]);
        return null;
      };
    }),
  { ssr: false }
);

// Single-use MapContainer wrapper - only renders once per key
function SingleUseMapContainer({ 
  center, 
  zoom, 
  scrollWheelZoom, 
  children, 
  mapKey,
  onInitialized 
}: { 
  center: LatLngExpression; 
  zoom: number; 
  scrollWheelZoom: boolean; 
  children: React.ReactNode;
  mapKey: string;
  onInitialized: () => void;
}) {
  // Call onInitialized after a brief delay
  useEffect(() => {
    const timer = setTimeout(() => {
      onInitialized();
    }, 100);
    return () => clearTimeout(timer);
  }, [onInitialized]);

  return (
    <MapContainer
      key={mapKey}
      center={center}
      zoom={zoom}
      style={{ height: "100%", width: "100%" }}
      scrollWheelZoom={scrollWheelZoom}
    >
      {children}
    </MapContainer>
  );
}

export function AddressMap({
  address,
  latitude,
  longitude,
  onLocationSelect,
  editable = false,
  allowAddressGeocode = false,
  mapContainerClassName = "aspect-video rounded-lg overflow-hidden border border-sand-200"
}: AddressMapProps) {
  const [mounted, setMounted] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [geocodeError, setGeocodeError] = useState<string | null>(null);
  /** View mode: coordinates from /api/geocode when API did not store geo on venue */
  const [viewResolved, setViewResolved] = useState<{ lat: number; lng: number } | null>(null);
  const [viewGeocodeStatus, setViewGeocodeStatus] = useState<"idle" | "loading" | "done" | "error">(
    "idle"
  );
  const [mapCenter, setMapCenter] = useState<LatLngExpression>([20.5937, 78.9629]); // Default to India center
  const [markerPosition, setMarkerPosition] = useState<LatLngExpression | null>(null);
  const [reverseGeocoding, setReverseGeocoding] = useState(false);
  /** Mirrors sample: fill "search" / preview with reverse- or forward-geocode display_name-style text */
  const [mapResolvedAddress, setMapResolvedAddress] = useState(address);
  const [shouldRenderMap, setShouldRenderMap] = useState(false);
  // Use refs to track state that shouldn't cause re-renders
  const mapKeyRef = useRef<string | null>(null);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInitializedRef = useRef<boolean>(false);
  const mapRenderedRef = useRef<boolean>(false);
  
  // Initialize the map key only once - use a stable identifier
  if (mapKeyRef.current === null) {
    mapKeyRef.current = `map-${editable ? 'edit' : 'view'}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  useEffect(() => {
    setMapResolvedAddress(address);
  }, [address]);

  // Only set initial state after mount to avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
    
    // Fix for default marker icons in Next.js - only run on client
    if (typeof window !== "undefined") {
      import("leaflet").then((L) => {
        delete (L.default.Icon.Default.prototype as any)._getIconUrl;
        L.default.Icon.Default.mergeOptions({
          iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
          iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
          shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
        });
      }).catch((err) => {
        console.error("Failed to load Leaflet for icon fix:", err);
      });
      
      // Delay map rendering slightly to ensure DOM is ready and prevent re-initialization
      const timer = setTimeout(() => {
        setShouldRenderMap(true);
      }, 150);
      
      return () => {
        clearTimeout(timer);
        // Reset on unmount
        setShouldRenderMap(false);
        mapRenderedRef.current = false;
        mapInitializedRef.current = false;
      };
    }
  }, []);

  const hasPropCoords = isValidLatLng(latitude, longitude);
  const effectiveLat =
    hasPropCoords ? latitude! : !editable && allowAddressGeocode ? viewResolved?.lat ?? null : null;
  const effectiveLng =
    hasPropCoords ? longitude! : !editable && allowAddressGeocode ? viewResolved?.lng ?? null : null;
  const hasEffectiveCoords = isValidLatLng(effectiveLat, effectiveLng);

  // View mode: resolve pin from address when coordinates missing
  useEffect(() => {
    if (editable || !allowAddressGeocode) return;
    if (hasPropCoords) {
      setViewResolved(null);
      setViewGeocodeStatus("idle");
      return;
    }
    const addr = address?.trim();
    if (!addr || addr.length < 8) {
      setViewResolved(null);
      setViewGeocodeStatus("error");
      return;
    }
    let cancelled = false;
    setViewGeocodeStatus("loading");
    setViewResolved(null);
    (async () => {
      try {
        const res = await apiFetch<{ latitude: number; longitude: number }>(
          `/api/geocode?address=${encodeURIComponent(addr)}`
        );
        if (cancelled) return;
        if (res.ok && res.data && isValidLatLng(res.data.latitude, res.data.longitude)) {
          setViewResolved({ lat: res.data.latitude, lng: res.data.longitude });
          setViewGeocodeStatus("done");
        } else {
          setViewGeocodeStatus("error");
        }
      } catch {
        if (!cancelled) setViewGeocodeStatus("error");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [editable, allowAddressGeocode, hasPropCoords, address, latitude, longitude]);

  // Sync map center / marker from props (editable) or resolved view coords (guest)
  useEffect(() => {
    if (!mounted) return;
    if (editable) {
      if (hasPropCoords) {
        const position: LatLngExpression = [latitude!, longitude!];
        setMapCenter(position);
        setMarkerPosition(position);
      }
      return;
    }
    if (hasEffectiveCoords && effectiveLat !== null && effectiveLng !== null) {
      const position: LatLngExpression = [effectiveLat, effectiveLng];
      setMapCenter(position);
      setMarkerPosition(position);
    } else {
      setMarkerPosition(null);
    }
  }, [
    mounted,
    editable,
    hasPropCoords,
    latitude,
    longitude,
    hasEffectiveCoords,
    effectiveLat,
    effectiveLng
  ]);

  // Track previous address to detect changes
  const previousAddressRef = useRef<string>("");

  // Auto-geocode when address changes (with debounce) - always update coordinates when address changes
  useEffect(() => {
    if (!mounted || !editable) return;
    
    const currentAddress = address?.trim() || "";
    const previousAddress = previousAddressRef.current?.trim() || "";
    
    // Only geocode if address actually changed
    if (currentAddress === previousAddress) return;
    
    // Update previous address
    previousAddressRef.current = currentAddress;
    
    // Don't auto-geocode if address is too short (less than 5 characters)
    // Reduced threshold to allow more addresses to be geocoded
    if (!currentAddress || currentAddress.length < 5) {
      return;
    }

    // Debounce geocoding to avoid too many API calls
    const timeoutId = setTimeout(() => {
      geocodeAddress(currentAddress);
    }, 1500); // Wait 1.5 seconds after user stops typing

    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address, mounted, editable]);

  // Auto-geocode when component mounts with an address
  useEffect(() => {
    if (!mounted || !editable) return;
    const currentAddress = address?.trim() || "";
    if (currentAddress && currentAddress.length >= 10) {
      // Set previous address to prevent duplicate geocoding on mount
      previousAddressRef.current = currentAddress;
      // Auto-geocode on mount if we have address
      const timeoutId = setTimeout(() => {
        geocodeAddress(currentAddress);
      }, 1000);
      return () => clearTimeout(timeoutId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, editable]);

  async function geocodeAddress(addressToGeocode: string) {
    if (!addressToGeocode.trim()) {
      setGeocodeError("Please enter an address");
      return;
    }

    setIsGeocoding(true);
    setGeocodeError(null);

    try {
      const res = await apiFetch<{
        latitude: number;
        longitude: number;
        formattedAddress: string;
        locality?: string;
        city?: string;
        state?: string;
        country?: string;
        postalCode?: string;
      }>(`/api/geocode?address=${encodeURIComponent(addressToGeocode.trim())}`);

      if (res.ok && res.data) {
        const { latitude: lat, longitude: lng, formattedAddress, locality, city, state, country, postalCode } = res.data;
        const position: LatLngExpression = [lat, lng];
        const line = formattedAddress || addressToGeocode;
        setMapResolvedAddress(line);
        setMapCenter(position);
        setMarkerPosition(position);
        onLocationSelect(line, lat, lng, {
          locality: locality || "",
          city: city || "",
          state: state || "",
          country: country || "",
          postalCode: postalCode || ""
        });
        setGeocodeError(null);
        console.log("[AddressMap] Successfully geocoded address:", formattedAddress);
      } else if (!res.ok) {
        const errorMsg = res.error || "Failed to find location. Please try a more specific address.";
        setGeocodeError(errorMsg);
        console.warn("Geocoding API error:", res.error);
        // Don't clear marker if we already have one - allow user to manually adjust
        if (!markerPosition) {
          setMarkerPosition(null);
        }
        // Show helpful message that user can click on map
        console.log("[AddressMap] User can click on map to select location manually");
      }
    } catch (error) {
      const errorMsg = "Failed to geocode address. You can click on the map to select a location manually.";
      setGeocodeError(errorMsg);
      console.error("Geocoding error:", error);
      // Don't clear marker if we already have one
      if (!markerPosition) {
        setMarkerPosition(null);
      }
    } finally {
      setIsGeocoding(false);
    }
  }

  /**
   * Same flow as vanilla Leaflet sample: map click → reverse geocode → center map, one marker, popup + filled input.
   * We call `/api/geocode?latitude=&longitude=` (Nominatim on the server with a proper User-Agent) instead of
   * browser `fetch` to nominatim.openstreetmap.org to respect usage policy.
   */
  async function handleMapClick(lat: number, lng: number) {
    if (!editable) return;

    setReverseGeocoding(true);
    setGeocodeError(null);

    try {
      // Reverse geocode to get address from coordinates
      const res = await apiFetch<{
        latitude: number;
        longitude: number;
        formattedAddress: string;
        locality?: string;
        city?: string;
        state?: string;
        country?: string;
        postalCode?: string;
      }>(`/api/geocode?latitude=${lat}&longitude=${lng}`);

      if (res.ok && res.data) {
        const { formattedAddress, locality, city, state, country, postalCode } = res.data;
        const position: LatLngExpression = [lat, lng];
        const line = formattedAddress || `Location at ${lat.toFixed(6)}, ${lng.toFixed(6)}`;
        setMapResolvedAddress(line);
        setMarkerPosition(position);
        setMapCenter(position);
        onLocationSelect(line, lat, lng, {
          locality: locality || "",
          city: city || "",
          state: state || "",
          country: country || "",
          postalCode: postalCode || ""
        });
      } else {
        // If reverse geocoding fails, still allow setting coordinates
        const position: LatLngExpression = [lat, lng];
        const fallback = `Location at ${lat.toFixed(6)}, ${lng.toFixed(6)}`;
        setMapResolvedAddress(fallback);
        setMarkerPosition(position);
        setMapCenter(position);
        onLocationSelect(fallback, lat, lng);
      }
    } catch (error) {
      // If reverse geocoding fails, still allow setting coordinates
      const position: LatLngExpression = [lat, lng];
      const fallback = `Location at ${lat.toFixed(6)}, ${lng.toFixed(6)}`;
      setMapResolvedAddress(fallback);
      setMarkerPosition(position);
      setMapCenter(position);
      onLocationSelect(fallback, lat, lng);
    } finally {
      setReverseGeocoding(false);
    }
  }

  // For view mode
  if (!editable) {
    if (!mounted) {
      return (
        <div className="w-full h-64 rounded-lg border border-sand-200 bg-sand-100 flex items-center justify-center text-sm text-ink-600">
          Loading map...
        </div>
      );
    }

    if (!hasEffectiveCoords) {
      if (allowAddressGeocode && viewGeocodeStatus === "loading") {
        return (
          <div className="w-full h-64 rounded-lg border border-sand-200 bg-sand-100 flex items-center justify-center text-sm text-ink-600">
            Finding location on map…
          </div>
        );
      }
      return (
        <div className="w-full h-64 rounded-lg border border-sand-200 bg-sand-100 flex flex-col items-center justify-center gap-1 px-4 text-center text-sm text-ink-600">
          <span>No pin on map yet.</span>
          {allowAddressGeocode && viewGeocodeStatus === "error" && address?.trim() && (
            <span className="text-xs text-ink-500">Could not place this address automatically.</span>
          )}
        </div>
      );
    }

    // Double-check mounted before rendering map components
    if (!mounted || typeof window === "undefined") {
      return (
        <div className="w-full h-64 rounded-lg border border-sand-200 bg-sand-100 flex items-center justify-center text-sm text-ink-600">
          Loading map...
        </div>
      );
    }

    const canRenderMap =
      mounted &&
      typeof window !== "undefined" &&
      shouldRenderMap &&
      Boolean(mapKeyRef.current);

    return (
      <div className="space-y-3">
        <div 
          ref={mapContainerRef}
          key={`map-wrapper-${mapKeyRef.current}`} 
          className={`relative min-h-0 ${mapContainerClassName}`}
        >
          {canRenderMap && mapKeyRef.current ? (
            <SingleUseMapContainer
              center={mapCenter}
              zoom={15}
              scrollWheelZoom={false}
              mapKey={mapKeyRef.current}
              onInitialized={() => {
                mapInitializedRef.current = true;
                mapRenderedRef.current = true;
              }}
            >
              <MapInvalidateSize />
              <TileLayer
                attribution={LEAFLET_DEFAULT_ATTRIBUTION}
                url={LEAFLET_DEFAULT_TILE_URL}
                subdomains="abcd"
                maxZoom={19}
              />
              <MapFlyToMarker position={markerPosition} zoom={15} />
              {markerPosition && (
                <Marker
                  key={`view-${String(latLngTuple(markerPosition)?.[0])}-${String(latLngTuple(markerPosition)?.[1])}-${(mapResolvedAddress || address || "").slice(0, 64)}`}
                  position={markerPosition}
                  eventHandlers={{
                    add: (e) => {
                      e.target.openPopup();
                    },
                  }}
                >
                  <Popup>
                    <div className="text-sm">
                      <strong>Location</strong>
                      <br />
                      {mapResolvedAddress || address || "Selected location"}
                    </div>
                  </Popup>
                </Marker>
              )}
            </SingleUseMapContainer>
          ) : !shouldRenderMap ? (
            <div className="flex min-h-[240px] w-full items-center justify-center bg-sand-100 text-sm text-ink-600">
              Loading map...
            </div>
          ) : (
            <div className="flex min-h-[240px] w-full items-center justify-center bg-sand-100 text-sm text-ink-600">
              Preparing map…
            </div>
          )}
        </div>
      </div>
    );
  }

  // For editable mode
  if (!mounted || typeof window === "undefined") {
    return (
      <div className="w-full h-64 rounded-lg border border-sand-200 bg-sand-100 flex items-center justify-center text-sm text-ink-600">
        Loading map...
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Address Geocoding */}
      <div>
        <label className="block text-sm font-medium text-ink-700 mb-2">
          Get Location from Address
        </label>
        <div className="flex gap-2">
          <input
            id="address-map-search-preview"
            type="text"
            value={mapResolvedAddress}
            readOnly
            placeholder="Enter address in the 'Venue address' field above..."
            className="flex-1 rounded-lg border border-sand-200 bg-sand-50 px-3 py-2 text-sm"
          />
          <button
            type="button"
            onClick={() => {
              if (address && address.trim()) {
                geocodeAddress(address);
              } else {
                setGeocodeError("Please enter an address in the 'Venue address' field first");
              }
            }}
            disabled={isGeocoding || !address?.trim()}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-50 whitespace-nowrap"
          >
            {isGeocoding ? "Finding..." : "Get Location"}
          </button>
        </div>
        {geocodeError && (
          <div className="mt-1 p-2 rounded-lg bg-red-50 border border-red-200">
            <p className="text-xs text-red-700 font-medium">{geocodeError}</p>
            <p className="text-xs text-red-600 mt-1">
              Tip: You can also click directly on the map below to select a location manually.
            </p>
          </div>
        )}
        {isGeocoding && (
          <p className="mt-1 text-xs text-ink-600">Searching location...</p>
        )}
        {reverseGeocoding && (
          <p className="mt-1 text-xs text-ink-600">Getting address for selected location...</p>
        )}
        <p className="mt-1 text-xs text-ink-600">
          Enter your address above and click "Get Location", or click on the map to select a location manually.
        </p>
      </div>

      {/* Interactive Map */}
      <div 
        ref={mapContainerRef}
        key={`map-wrapper-edit-${mapKeyRef.current}`} 
        className={`relative min-h-0 ${mapContainerClassName}`}
      >
        {mounted &&
        typeof window !== "undefined" &&
        shouldRenderMap &&
        mapKeyRef.current ? (
          <SingleUseMapContainer
            center={mapCenter}
            zoom={markerPosition ? 15 : 5}
            scrollWheelZoom={true}
            mapKey={mapKeyRef.current}
            onInitialized={() => {
              mapInitializedRef.current = true;
              mapRenderedRef.current = true;
            }}
          >
            <MapInvalidateSize />
            <TileLayer
              attribution={LEAFLET_DEFAULT_ATTRIBUTION}
              url={LEAFLET_DEFAULT_TILE_URL}
              subdomains="abcd"
              maxZoom={19}
            />
            <MapFlyToMarker position={markerPosition} zoom={15} />
            {markerPosition && (
              <Marker
                key={`edit-${String(latLngTuple(markerPosition)?.[0])}-${String(latLngTuple(markerPosition)?.[1])}-${(mapResolvedAddress || "").slice(0, 64)}`}
                position={markerPosition}
                eventHandlers={{
                  add: (e) => {
                    e.target.openPopup();
                  },
                }}
              >
                <Popup>
                  <div className="text-sm">
                    <strong>Selected location</strong>
                    <br />
                    {mapResolvedAddress || address || "Click map to pick a point"}
                  </div>
                </Popup>
              </Marker>
            )}
            <MapClickHandler onMapClick={handleMapClick} />
          </SingleUseMapContainer>
        ) : !shouldRenderMap ? (
          <div className="flex min-h-[240px] w-full items-center justify-center bg-sand-100 text-sm text-ink-600">
            Loading map...
          </div>
        ) : (
          <div className="flex min-h-[240px] w-full items-center justify-center bg-sand-100 text-sm text-ink-600">
            Preparing map…
          </div>
        )}
      </div>
    </div>
  );
}
