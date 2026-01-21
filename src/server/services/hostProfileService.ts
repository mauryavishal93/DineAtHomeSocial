import { connectMongo } from "@/server/db/mongoose";
import { HostProfile } from "@/server/models/HostProfile";
import { Venue } from "@/server/models/Venue";

export async function getHostProfile(userId: string) {
  await connectMongo();
  const profile = await HostProfile.findOne({ userId }).lean();
  if (!profile) return null;

  const venueId = (profile as unknown as { venueId?: unknown }).venueId;
  const venue = (venueId
    ? await Venue.findById(venueId).lean()
    : await Venue.findOne({ hostUserId: userId }).lean()) as
    | {
        _id: unknown;
        name?: string;
        address?: string;
        locality?: string;
        city?: string;
        state?: string;
        country?: string;
        postalCode?: string;
        foodCategories?: string[];
        gamesAvailable?: string[];
        geo?: { coordinates?: number[] };
        images?: Array<{ filePath: string; fileMime: string; fileName: string; uploadedAt: Date }>;
      }
    | null;

  const geo = venue?.geo?.coordinates?.length === 2 ? venue.geo.coordinates : null;
  return {
    firstName: (profile as any).firstName ?? "",
    lastName: (profile as any).lastName ?? "",
    age: (profile as any).age ?? 0,
    bio: (profile as any).bio ?? "",
    interests: (profile as any).interests ?? [],
    name: (profile as any).name ?? "",

    venueId: venue?._id ? String(venue._id) : null,
    venueName: venue?.name ?? (profile as any).venueName ?? "",
    venueAddress: venue?.address ?? (profile as any).venueAddress ?? "",
    locality: venue?.locality ?? "",
    city: venue?.city ?? "",
    state: venue?.state ?? "",
    country: venue?.country ?? "",
    postalCode: venue?.postalCode ?? "",
    cuisines: venue?.foodCategories ?? (profile as any).foodCategories ?? [],
    activities: venue?.gamesAvailable ?? (profile as any).availableGames ?? [],
    latitude: geo ? geo[1] : null,
    longitude: geo ? geo[0] : null,
    venueImages: venue?.images ?? []
  };
}

export async function upsertHostProfile(
  userId: string,
  input: {
    firstName: string;
    lastName: string;
    age: number;
    interests: string[];
    bio?: string;
    venueName: string;
    venueAddress: string;
    locality?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
    description?: string;
    cuisines: string[];
    activities: string[];
    latitude?: number | null;
    longitude?: number | null;
  }
) {
  await connectMongo();

  const fullName = `${input.firstName} ${input.lastName}`.trim();

  const profileUpdate: any = {
    firstName: input.firstName,
    lastName: input.lastName,
    age: input.age,
    interests: input.interests,
    name: fullName,
    venueName: input.venueName,
    venueAddress: input.venueAddress,
    foodCategories: input.cuisines,
    availableGames: input.activities
  };

  if (input.bio !== undefined) {
    profileUpdate.bio = input.bio;
  }

  const profile = await HostProfile.findOneAndUpdate(
    { userId },
    { $set: profileUpdate },
    { new: true, upsert: true }
  );

  // Upsert a Venue for this host and link it.
  const venueUpdate: any = {
    name: input.venueName,
    address: input.venueAddress,
    foodCategories: input.cuisines,
    gamesAvailable: input.activities
  };

  // Always set address fields, even if empty strings (to allow clearing)
  venueUpdate.locality = input.locality ?? "";
  venueUpdate.city = input.city ?? "";
  venueUpdate.state = input.state ?? "";
  venueUpdate.country = input.country ?? "";
  venueUpdate.postalCode = input.postalCode ?? "";
  if (input.description !== undefined) {
    venueUpdate.description = input.description;
  }
  if (typeof input.latitude === "number" && typeof input.longitude === "number") {
    venueUpdate.geo = { type: "Point", coordinates: [input.longitude, input.latitude] };
  }

  const venue = await Venue.findOneAndUpdate(
    { hostUserId: userId },
    { $set: venueUpdate },
    { new: true, upsert: true }
  );

  await HostProfile.updateOne(
    { _id: (profile as any)._id },
    { $set: { venueId: (venue as any)._id } }
  );

  return {
    firstName: (profile as any).firstName ?? "",
    lastName: (profile as any).lastName ?? "",
    age: (profile as any).age ?? 0,
    interests: (profile as any).interests ?? [],
    bio: (profile as any).bio ?? "",
    name: (profile as any).name ?? "",
    venueId: String((venue as any)._id),
    venueName: venue?.name ?? "",
    venueAddress: venue?.address ?? "",
    locality: venue?.locality ?? "",
    city: venue?.city ?? "",
    state: venue?.state ?? "",
    country: venue?.country ?? "",
    postalCode: venue?.postalCode ?? "",
    description: venue?.description ?? "",
    cuisines: venue?.foodCategories ?? [],
    activities: venue?.gamesAvailable ?? [],
    latitude:
      venue?.geo?.coordinates?.length === 2 ? venue.geo.coordinates[1] : null,
    longitude:
      venue?.geo?.coordinates?.length === 2 ? venue.geo.coordinates[0] : null
  };
}

