import { connectMongo } from "@/server/db/mongoose";
import { GuestProfile } from "@/server/models/GuestProfile";

function splitName(fullName: string) {
  const cleaned = fullName.trim().replace(/\s+/g, " ");
  const [first, ...rest] = cleaned.split(" ");
  return { firstName: first ?? "", lastName: rest.join(" ") };
}

export async function getGuestProfile(userId: string) {
  await connectMongo();
  const profile = await GuestProfile.findOne({ userId });
  if (!profile) return null;
  return {
    name: `${profile.firstName ?? ""} ${profile.lastName ?? ""}`.trim(),
    age: profile.age ?? 0,
    gender: profile.gender ?? "",
    interests: profile.interests ?? []
  };
}

export async function upsertGuestProfile(
  userId: string,
  input: { name: string; age: number; gender: string; interests: string[] }
) {
  await connectMongo();
  const { firstName, lastName } = splitName(input.name);

  const profile = await GuestProfile.findOneAndUpdate(
    { userId },
    {
      $set: {
        firstName,
        lastName,
        age: input.age,
        gender: input.gender,
        interests: input.interests
      }
    },
    { new: true, upsert: true }
  );

  return {
    name: `${profile.firstName ?? ""} ${profile.lastName ?? ""}`.trim(),
    age: profile.age ?? 0,
    gender: profile.gender ?? "",
    interests: profile.interests ?? []
  };
}

