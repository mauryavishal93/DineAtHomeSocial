import { ok, serverError } from "@/server/http/response";
import { connectMongo } from "@/server/db/mongoose";
import { EventSlot } from "@/server/models/EventSlot";
import { Venue } from "@/server/models/Venue";
import { HostProfile } from "@/server/models/HostProfile";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    await connectMongo();
    
    const now = new Date();
    
    // Get all open upcoming events
    const events = await EventSlot.find({
      status: "OPEN",
      endAt: { $gt: now }
    })
      .populate({ path: "venueId", select: "city state locality foodCategories gamesAvailable" })
      .select("hostUserId cuisines gamesAvailable foodTags allergenFreeKitchen certifiedLabels")
      .lean();
    
    // Get unique host IDs from events
    const hostUserIds = Array.from(new Set(events.map((e: any) => String(e.hostUserId))));
    
    // Get host profiles only for hosts with active events
    const hostProfiles = await HostProfile.find({
      userId: { $in: hostUserIds }
    })
      .select("interests")
      .lean();
    
    // Extract unique values
    const cities = new Set<string>();
    const states = new Set<string>();
    const localities = new Set<string>();
    const cuisines = new Set<string>();
    const activities = new Set<string>();
    const dietary = new Set<string>();
    const interests = new Set<string>();
    
    events.forEach((event: any) => {
      const venue = event.venueId as any;
      
      // Location
      if (venue?.city) cities.add(venue.city);
      if (venue?.state) states.add(venue.state);
      if (venue?.locality) localities.add(venue.locality);
      
      // Cuisines (from event and venue)
      if (event.cuisines && Array.isArray(event.cuisines)) {
        event.cuisines.forEach((c: string) => {
          if (c && c.trim()) cuisines.add(c.trim());
        });
      }
      if (venue?.foodCategories && Array.isArray(venue.foodCategories)) {
        venue.foodCategories.forEach((c: string) => {
          if (c && c.trim()) cuisines.add(c.trim());
        });
      }
      
      // Activities (from event and venue)
      if (event.gamesAvailable && Array.isArray(event.gamesAvailable)) {
        event.gamesAvailable.forEach((a: string) => {
          if (a && a.trim()) activities.add(a.trim());
        });
      }
      if (venue?.gamesAvailable && Array.isArray(venue.gamesAvailable)) {
        venue.gamesAvailable.forEach((a: string) => {
          if (a && a.trim()) activities.add(a.trim());
        });
      }
      
      // Dietary (from event)
      if (event.foodTags && Array.isArray(event.foodTags)) {
        event.foodTags.forEach((tag: string) => {
          if (tag && tag.trim()) dietary.add(tag.trim());
        });
      }
      if (event.allergenFreeKitchen && Array.isArray(event.allergenFreeKitchen)) {
        event.allergenFreeKitchen.forEach((allergen: string) => {
          if (allergen && allergen.trim()) dietary.add(allergen.trim());
        });
      }
      if (event.certifiedLabels && Array.isArray(event.certifiedLabels)) {
        event.certifiedLabels.forEach((label: string) => {
          if (label && label.trim()) dietary.add(label.trim());
        });
      }
    });
    
    // Interests (from host profiles)
    hostProfiles.forEach((profile: any) => {
      if (profile.interests && Array.isArray(profile.interests)) {
        profile.interests.forEach((interest: string) => {
          if (interest && interest.trim()) interests.add(interest.trim());
        });
      }
    });
    
    return ok({
      cities: Array.from(cities).sort(),
      states: Array.from(states).sort(),
      localities: Array.from(localities).sort(),
      cuisines: Array.from(cuisines).sort(),
      activities: Array.from(activities).sort(),
      dietary: Array.from(dietary).sort(),
      interests: Array.from(interests).sort()
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed";
    return serverError(msg);
  }
}
