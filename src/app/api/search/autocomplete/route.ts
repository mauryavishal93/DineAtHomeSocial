import { ok, serverError } from "@/server/http/response";
import { connectMongo } from "@/server/db/mongoose";
import { EventSlot } from "@/server/models/EventSlot";
import { Venue } from "@/server/models/Venue";
import { HostProfile } from "@/server/models/HostProfile";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q")?.toLowerCase().trim() || "";
    const type = searchParams.get("type") || "all"; // all, city, cuisine, activity
    
    if (!query || query.length < 2) {
      return ok({ suggestions: [] });
    }
    
    await connectMongo();
    
    const now = new Date();
    const suggestions: Array<{ value: string; type: string; label: string }> = [];
    
    // Get all open upcoming events
    const events = await EventSlot.find({
      status: "OPEN",
      endAt: { $gt: now }
    })
      .populate({ path: "venueId", select: "city state locality foodCategories gamesAvailable" })
      .select("cuisines gamesAvailable foodTags")
      .lean();
    
    const cities = new Set<string>();
    const localities = new Set<string>();
    const cuisines = new Set<string>();
    const activities = new Set<string>();
    
    events.forEach((event: any) => {
      const venue = event.venueId as any;
      
      if (venue?.city && (type === "all" || type === "city")) {
        cities.add(venue.city);
      }
      if (venue?.locality && (type === "all" || type === "city")) {
        localities.add(venue.locality);
      }
      if (event.cuisines && Array.isArray(event.cuisines) && (type === "all" || type === "cuisine")) {
        event.cuisines.forEach((c: string) => {
          if (c && c.trim()) cuisines.add(c.trim());
        });
      }
      if (venue?.foodCategories && Array.isArray(venue.foodCategories) && (type === "all" || type === "cuisine")) {
        venue.foodCategories.forEach((c: string) => {
          if (c && c.trim()) cuisines.add(c.trim());
        });
      }
      if (event.gamesAvailable && Array.isArray(event.gamesAvailable) && (type === "all" || type === "activity")) {
        event.gamesAvailable.forEach((a: string) => {
          if (a && a.trim()) activities.add(a.trim());
        });
      }
      if (venue?.gamesAvailable && Array.isArray(venue.gamesAvailable) && (type === "all" || type === "activity")) {
        venue.gamesAvailable.forEach((a: string) => {
          if (a && a.trim()) activities.add(a.trim());
        });
      }
    });
    
    // Filter and add suggestions
    if (type === "all" || type === "city") {
      Array.from(cities).forEach(city => {
        if (city.toLowerCase().includes(query)) {
          suggestions.push({ value: city, type: "city", label: `📍 ${city}` });
        }
      });
      Array.from(localities).forEach(locality => {
        if (locality.toLowerCase().includes(query)) {
          suggestions.push({ value: locality, type: "locality", label: `📍 ${locality}` });
        }
      });
    }
    
    if (type === "all" || type === "cuisine") {
      Array.from(cuisines).forEach(cuisine => {
        if (cuisine.toLowerCase().includes(query)) {
          suggestions.push({ value: cuisine, type: "cuisine", label: `🍽️ ${cuisine}` });
        }
      });
    }
    
    if (type === "all" || type === "activity") {
      Array.from(activities).forEach(activity => {
        if (activity.toLowerCase().includes(query)) {
          suggestions.push({ value: activity, type: "activity", label: `🎲 ${activity}` });
        }
      });
    }
    
    // Sort by relevance (exact match first, then partial)
    suggestions.sort((a, b) => {
      const aExact = a.value.toLowerCase() === query;
      const bExact = b.value.toLowerCase() === query;
      if (aExact && !bExact) return -1;
      if (!aExact && bExact) return 1;
      return a.value.localeCompare(b.value);
    });
    
    return ok({ suggestions: suggestions.slice(0, 10) });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed";
    return serverError(msg);
  }
}
