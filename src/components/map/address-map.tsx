"use client";

import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/http";

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

export function AddressMap({
  address,
  latitude,
  longitude,
  onLocationSelect,
  editable = false
}: AddressMapProps) {
  const [mounted, setMounted] = useState(false);
  const [tempLat, setTempLat] = useState<string>("");
  const [tempLng, setTempLng] = useState<string>("");
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [geocodeError, setGeocodeError] = useState<string | null>(null);

  // Only set initial state after mount to avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
    if (latitude !== null && longitude !== null) {
      setTempLat(latitude.toString());
      setTempLng(longitude.toString());
    }
  }, []);

  // Sync local state with props when they change
  useEffect(() => {
    if (mounted && latitude !== null && longitude !== null) {
      setTempLat(latitude.toString());
      setTempLng(longitude.toString());
    } else if (mounted && (latitude === null || longitude === null)) {
      setTempLat("");
      setTempLng("");
    }
  }, [latitude, longitude, mounted]);

  // Auto-geocode when address changes (with debounce)
  useEffect(() => {
    if (!mounted || !editable) return;
    
    // Don't auto-geocode if address is too short (less than 5 characters)
    if (!address || !address.trim() || address.trim().length < 5) return;

    // Don't auto-geocode if we already have coordinates (to avoid re-geocoding on every change)
    if (latitude !== null && longitude !== null) return;

    // Debounce geocoding to avoid too many API calls
    const timeoutId = setTimeout(() => {
      geocodeAddress(address.trim());
    }, 2000); // Wait 2 seconds after user stops typing

    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address, mounted, editable]); // Note: geocodeAddress excluded to avoid infinite loops

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
        setTempLat(lat.toString());
        setTempLng(lng.toString());
        onLocationSelect(formattedAddress || addressToGeocode, lat, lng, {
          locality: locality || "",
          city: city || "",
          state: state || "",
          country: country || "",
          postalCode: postalCode || ""
        });
        setGeocodeError(null); // Clear any previous errors
      } else {
        const errorMsg = res.error || "Failed to find location. Please try a more specific address.";
        setGeocodeError(errorMsg);
        console.error("Geocoding API error:", res.error);
      }
    } catch (error) {
      setGeocodeError("Failed to geocode address. Please try entering coordinates manually.");
      console.error("Geocoding error:", error);
    } finally {
      setIsGeocoding(false);
    }
  }

  function handleCoordinateChange() {
    const lat = parseFloat(tempLat);
    const lng = parseFloat(tempLng);
    if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
      onLocationSelect(address || "Custom Location", lat, lng);
      setGeocodeError(null);
    }
  }

  // For view mode, use embed API (same as host profile page)
  if (!editable) {
    if (!mounted) {
      return (
        <div className="w-full h-64 rounded-lg border border-sand-200 bg-sand-100 flex items-center justify-center text-sm text-ink-600">
          Loading...
        </div>
      );
    }

    if (!latitude || !longitude) {
      return (
        <div className="w-full h-64 rounded-lg border border-sand-200 bg-sand-100 flex items-center justify-center text-sm text-ink-600">
          No location set
        </div>
      );
    }

    return (
      <div className="space-y-3">
        <div className="aspect-video bg-sand-100 rounded-lg overflow-hidden">
          <iframe
            width="100%"
            height="100%"
            frameBorder="0"
            style={{ border: 0 }}
            src={`https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dRWTYQEA8HUh8w&q=${latitude},${longitude}&zoom=15`}
            allowFullScreen
          />
        </div>
        <a
          href={`https://www.google.com/maps?q=${latitude},${longitude}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-ink-600 hover:text-ink-900 inline-block"
        >
          View on Google Maps →
        </a>
      </div>
    );
  }

  // For editable mode, show map with address geocoding
  if (!mounted) {
    return (
      <div className="w-full h-64 rounded-lg border border-sand-200 bg-sand-100 flex items-center justify-center text-sm text-ink-600">
        Loading...
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
        <p className="mt-1 text-xs text-ink-600">
          Enter your address in the "Venue address" field above. The map will automatically search for the location after you stop typing. Or click "Get Location" to search now.
        </p>
      </div>

      {/* Show map if coordinates exist */}
      {latitude && longitude ? (
        <div className="space-y-3">
          <div className="aspect-video bg-sand-100 rounded-lg overflow-hidden">
            <iframe
              width="100%"
              height="100%"
              frameBorder="0"
              style={{ border: 0 }}
              src={`https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dRWTYQEA8HUh8w&q=${latitude},${longitude}&zoom=15`}
              allowFullScreen
            />
          </div>
          <a
            href={`https://www.google.com/maps?q=${latitude},${longitude}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-ink-600 hover:text-ink-900 inline-block"
          >
            Open in Google Maps to adjust location →
          </a>
        </div>
      ) : (
        <div className="w-full h-64 rounded-lg border border-sand-200 bg-sand-100 flex items-center justify-center text-sm text-ink-600">
          Enter address and click "Get Location" to see the map
        </div>
      )}
    </div>
  );
}
