"use client";

import React, { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { apiFetch } from "@/lib/http";

// Import Leaflet types only (no runtime import to avoid SSR issues)
import type { LatLngExpression } from "leaflet";

// Global registry to track initialized map keys (prevents re-initialization)
const initializedMapKeys = new Set<string>();

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
  // Check global registry - if this key was already used, don't render
  if (initializedMapKeys.has(mapKey)) {
    return <div style={{ height: "100%", width: "100%", background: "transparent" }} />;
  }

  // Mark as initialized immediately
  initializedMapKeys.add(mapKey);

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
  editable = false
}: AddressMapProps) {
  const [mounted, setMounted] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [geocodeError, setGeocodeError] = useState<string | null>(null);
  const [mapCenter, setMapCenter] = useState<LatLngExpression>([20.5937, 78.9629]); // Default to India center
  const [markerPosition, setMarkerPosition] = useState<LatLngExpression | null>(null);
  const [reverseGeocoding, setReverseGeocoding] = useState(false);
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
        if (!mapRenderedRef.current && !mapInitializedRef.current) {
          setShouldRenderMap(true);
        }
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

  // Update map center and marker when coordinates change
  useEffect(() => {
    if (mounted && latitude !== null && longitude !== null && 
        typeof latitude === "number" && typeof longitude === "number" &&
        !isNaN(latitude) && !isNaN(longitude) &&
        isFinite(latitude) && isFinite(longitude)) {
      const position: LatLngExpression = [latitude, longitude];
      setMapCenter(position);
      setMarkerPosition(position);
    } else if (mounted) {
      setMarkerPosition(null);
    }
  }, [latitude, longitude, mounted]);

  // Mark map as rendered after it's been displayed to prevent re-initialization
  useEffect(() => {
    if (shouldRenderMap && !mapRenderedRef.current) {
      const timer = setTimeout(() => {
        mapRenderedRef.current = true;
        mapInitializedRef.current = true;
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [shouldRenderMap]);

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
    
    // Don't auto-geocode if address is too short (less than 10 characters)
    if (!currentAddress || currentAddress.length < 10) {
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
        setMapCenter(position);
        setMarkerPosition(position);
        onLocationSelect(formattedAddress || addressToGeocode, lat, lng, {
          locality: locality || "",
          city: city || "",
          state: state || "",
          country: country || "",
          postalCode: postalCode || ""
        });
        setGeocodeError(null);
      } else if (!res.ok) {
        const errorMsg = res.error || "Failed to find location. Please try a more specific address.";
        setGeocodeError(errorMsg);
        console.error("Geocoding API error:", res.error);
      }
    } catch (error) {
      setGeocodeError("Failed to geocode address. Please try again.");
      console.error("Geocoding error:", error);
    } finally {
      setIsGeocoding(false);
    }
  }

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
        setMarkerPosition(position);
        setMapCenter(position);
        onLocationSelect(formattedAddress || `Location at ${lat.toFixed(6)}, ${lng.toFixed(6)}`, lat, lng, {
          locality: locality || "",
          city: city || "",
          state: state || "",
          country: country || "",
          postalCode: postalCode || ""
        });
      } else {
        // If reverse geocoding fails, still allow setting coordinates
        const position: LatLngExpression = [lat, lng];
        setMarkerPosition(position);
        setMapCenter(position);
        onLocationSelect(`Location at ${lat.toFixed(6)}, ${lng.toFixed(6)}`, lat, lng);
      }
    } catch (error) {
      // If reverse geocoding fails, still allow setting coordinates
      const position: LatLngExpression = [lat, lng];
      setMarkerPosition(position);
      setMapCenter(position);
      onLocationSelect(`Location at ${lat.toFixed(6)}, ${lng.toFixed(6)}`, lat, lng);
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

    // Ensure we have valid coordinates before rendering map
    if (latitude === null || longitude === null || 
        typeof latitude !== "number" || typeof longitude !== "number" ||
        isNaN(latitude) || isNaN(longitude) ||
        !isFinite(latitude) || !isFinite(longitude)) {
      return (
        <div className="w-full h-64 rounded-lg border border-sand-200 bg-sand-100 flex items-center justify-center text-sm text-ink-600">
          No location set
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

    // Check if map container already has a Leaflet map instance
    const canRenderMap = mounted && 
                        typeof window !== "undefined" && 
                        shouldRenderMap && 
                        mapKeyRef.current && 
                        !mapRenderedRef.current && 
                        !mapInitializedRef.current &&
                        (!mapContainerRef.current || !(mapContainerRef.current as any)._leaflet_id);

    return (
      <div className="space-y-3">
        <div 
          ref={mapContainerRef}
          key={`map-wrapper-${mapKeyRef.current}`} 
          className="aspect-video rounded-lg overflow-hidden border border-sand-200"
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
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {markerPosition && (
                <Marker position={markerPosition}>
                  <Popup>
                    <div className="text-sm">
                      <strong>Location</strong>
                      <br />
                      {address || "Selected location"}
                    </div>
                  </Popup>
                </Marker>
              )}
            </SingleUseMapContainer>
          ) : !shouldRenderMap ? (
            <div className="w-full h-full bg-sand-100 flex items-center justify-center text-sm text-ink-600">
              Loading map...
            </div>
          ) : null}
        </div>
        <a
          href={`https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}&zoom=15`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-ink-600 hover:text-ink-900 inline-block"
        >
          View on OpenStreetMap →
        </a>
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
            type="text"
            value={address}
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
          <p className="mt-1 text-xs text-red-600">{geocodeError}</p>
        )}
        {isGeocoding && (
          <p className="mt-1 text-xs text-ink-600">Searching location...</p>
        )}
        {reverseGeocoding && (
          <p className="mt-1 text-xs text-ink-600">Getting address for selected location...</p>
        )}
        <p className="mt-1 text-xs text-ink-600">
          Enter your address above and click "Get Location", or click on the map to select a location.
        </p>
      </div>

      {/* Interactive Map */}
      <div 
        ref={mapContainerRef}
        key={`map-wrapper-edit-${mapKeyRef.current}`} 
        className="aspect-video rounded-lg overflow-hidden border border-sand-200"
      >
        {(() => {
          // Check if map container already has a Leaflet map instance
          const canRenderMap = mounted && 
                              typeof window !== "undefined" && 
                              shouldRenderMap && 
                              mapKeyRef.current && 
                              !mapRenderedRef.current && 
                              !mapInitializedRef.current &&
                              (!mapContainerRef.current || !(mapContainerRef.current as any)._leaflet_id);
          return canRenderMap;
        })() && mapKeyRef.current ? (
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
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {markerPosition && (
              <Marker position={markerPosition}>
                <Popup>
                  <div className="text-sm">
                    <strong>Selected Location</strong>
                    <br />
                    {address || "Click on map to select"}
                  </div>
                </Popup>
              </Marker>
            )}
            <MapClickHandler onMapClick={handleMapClick} />
          </SingleUseMapContainer>
        ) : !shouldRenderMap ? (
          <div className="w-full h-full bg-sand-100 flex items-center justify-center text-sm text-ink-600">
            Loading map...
          </div>
        ) : null}
      </div>
      {markerPosition && (
        <a
          href={`https://www.openstreetmap.org/?mlat=${(markerPosition as [number, number])[0]}&mlon=${(markerPosition as [number, number])[1]}&zoom=15`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-ink-600 hover:text-ink-900 inline-block"
        >
          Open in OpenStreetMap →
        </a>
      )}
    </div>
  );
}
