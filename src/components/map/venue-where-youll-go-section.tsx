"use client";

/**
 * Listing-style “Where you’ll go” block (similar to activity booking pages):
 * venue title, location lines, Open in Maps + Get directions, then embedded Leaflet
 * (`.leaflet-container`, touch/zoom classes come from Leaflet when the map mounts).
 */
import dynamic from "next/dynamic";
import { googleMapsDirectionsUrl, googleMapsVenueUrl } from "@/lib/google-maps-links";
import { buildVenueAddressQuery, isValidLatLng } from "@/lib/openstreetmap-links";

const AddressMap = dynamic(() => import("./address-map").then((m) => m.AddressMap), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-[280px] w-full items-center justify-center rounded-xl border border-sand-200 bg-sand-100 text-sm text-ink-600">
      Loading map…
    </div>
  )
});

export type VenueWhereYoullGoSectionProps = {
  venueName: string;
  venueAddress: string;
  locality?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  latitude?: number | null;
  longitude?: number | null;
  className?: string;
};

function locationSubtitle(p: Pick<VenueWhereYoullGoSectionProps, "locality" | "city" | "state" | "country">) {
  const parts = [p.city, p.country].filter((x): x is string => Boolean(x?.trim()));
  if (parts.length >= 1) return parts.join(", ");
  return [p.locality, p.state, p.country].filter((x): x is string => Boolean(x?.trim())).join(", ");
}

const btnBase =
  "inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-500";

export function VenueWhereYoullGoSection({
  venueName,
  venueAddress,
  locality,
  city,
  state,
  country,
  postalCode,
  latitude,
  longitude,
  className = ""
}: VenueWhereYoullGoSectionProps) {
  const addressQuery = buildVenueAddressQuery([
    venueAddress,
    locality,
    city,
    state,
    postalCode,
    country
  ]);
  const mapAddressQuery = buildVenueAddressQuery([venueAddress, locality, city, state, postalCode]);
  const hasCoords = isValidLatLng(latitude, longitude);
  const mapHref = googleMapsVenueUrl({
    latitude,
    longitude,
    addressQuery
  });
  const directionsHref = googleMapsDirectionsUrl({
    latitude,
    longitude,
    addressQuery
  });
  const subtitle = locationSubtitle({ locality, city, state, country });

  return (
    <section
      className={`rounded-3xl border border-sand-200 bg-white/80 p-6 shadow-card backdrop-blur md:p-8 ${className}`.trim()}
    >
      <h2 className="font-display text-xl font-semibold tracking-tight text-ink-900 md:text-2xl">
        Where you&apos;ll go
      </h2>

      <div className="mt-5 space-y-1">
        <h3 className="text-base font-semibold text-ink-900 md:text-lg">{venueName || "Venue"}</h3>
        {subtitle ? <p className="text-sm text-ink-600">{subtitle}</p> : null}
        {postalCode?.trim() ? (
          <p className="font-mono text-sm tracking-wide text-ink-700">{postalCode.trim()}</p>
        ) : null}
        <p className="pt-1 text-sm leading-relaxed text-ink-800">{venueAddress}</p>
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        <a
          href={mapHref}
          target="_blank"
          rel="noopener noreferrer"
          title="Opens in Google Maps"
          className={`${btnBase} border-2 border-ink-200 bg-white text-ink-900 shadow-sm hover:bg-sand-50`}
        >
          <span className="text-base" aria-hidden>
            🗺
          </span>
          Open in Google Maps
        </a>
        {directionsHref ? (
          <a
            href={directionsHref}
            target="_blank"
            rel="noopener noreferrer"
            title="Opens directions in Google Maps"
            className={`${btnBase} border-2 border-violet-500 bg-violet-600 text-white shadow-md hover:bg-violet-700`}
          >
            Get directions
          </a>
        ) : null}
      </div>

      <div className="mt-6">
        <AddressMap
          address={mapAddressQuery}
          latitude={hasCoords ? latitude! : null}
          longitude={hasCoords ? longitude! : null}
          editable={false}
          allowAddressGeocode
          mapContainerClassName="h-72 min-h-[280px] w-full overflow-hidden rounded-xl border border-sand-200 shadow-inner md:h-80"
          onLocationSelect={() => {
            /* view-only */
          }}
        />
      </div>
    </section>
  );
}
