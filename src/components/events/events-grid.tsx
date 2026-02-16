"use client";

import { useEffect, useState } from "react";
import { EventCard, type UIEvent } from "@/components/events/event-card";
import { apiFetch } from "@/lib/http";

interface EventsGridProps {
  filters?: {
    cities?: string[];
    localities?: string[];
    states?: string[];
    cuisines?: string[];
    interests?: string[];
    dietary?: string[];
    activities?: string[];
  };
}

export function EventsGrid({ filters }: EventsGridProps = {}) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [events, setEvents] = useState<UIEvent[]>([]);

  // Create a stable string representation of filters for dependency tracking
  const filtersKey = filters ? JSON.stringify(filters) : "";

  useEffect(() => {
    let cancelled = false;
    
    (async () => {
      setLoading(true);
      setError(null);
      
      // Build query string with filters (support arrays)
      const params = new URLSearchParams();
      if (filters?.cities && filters.cities.length > 0) {
        filters.cities.forEach(city => params.append("city", city));
      }
      if (filters?.localities && filters.localities.length > 0) {
        filters.localities.forEach(locality => params.append("locality", locality));
      }
      if (filters?.states && filters.states.length > 0) {
        filters.states.forEach(state => params.append("state", state));
      }
      if (filters?.cuisines && filters.cuisines.length > 0) {
        filters.cuisines.forEach(cuisine => params.append("cuisine", cuisine));
      }
      if (filters?.interests && filters.interests.length > 0) {
        filters.interests.forEach(interest => params.append("interest", interest));
      }
      if (filters?.dietary && filters.dietary.length > 0) {
        filters.dietary.forEach(diet => params.append("dietary", diet));
      }
      if (filters?.activities && filters.activities.length > 0) {
        filters.activities.forEach(activity => params.append("activity", activity));
      }
      
      const url = `/api/events${params.toString() ? `?${params.toString()}` : ""}`;
      try {
        const res = await apiFetch<any[]>(url, { method: "GET" });
        if (cancelled) return;
        
        if (!res.ok) {
          setError(res.error || "Failed to load events");
          setLoading(false);
          return;
        }
        setEvents(
          (res.data ?? []).map((e) => ({
            id: e.id,
            title: e.title,
            startAt: e.startAt,
            endAt: e.endAt,
            seatsLeft: e.seatsLeft ?? 0,
            maxGuests: e.maxGuests ?? 0,
            priceFrom: e.priceFrom ?? 0,
            locality: e.locality ?? "",
            city: e.city ?? "",
            venueName: e.venueName ?? "",
            hostName: e.hostName ?? "Host",
            hostUserId: e.hostUserId ?? "",
            hostRating: e.hostRating ?? 0,
            verified: Boolean(e.verified),
            governmentIdPath: e.governmentIdPath ?? "",
            foodTags: e.foodTags ?? [],
            cuisines: e.cuisines ?? [],
            foodType: e.foodType ?? "",
            activities: e.activities ?? [],
            eventImages: e.eventImages ?? [],
            eventVideos: e.eventVideos ?? []
          }))
        );
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Failed to load events");
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();
    
    return () => {
      cancelled = true;
    };
  }, [filtersKey]);

  if (loading) return <div className="text-sm text-ink-700">Loading events…</div>;
  if (error) return <div className="text-sm text-red-600">Failed to load: {error}</div>;
  if (events.length === 0) {
    const hasFilters = filters && Object.keys(filters).length > 0;
    return (
      <div className="text-sm text-ink-700">
        {hasFilters 
          ? "No events match your selected filters. Try adjusting your search criteria."
          : "No events posted yet."}
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:gap-5 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
      {events.map((ev) => (
        <EventCard key={ev.id} ev={ev} />
      ))}
    </div>
  );
}

