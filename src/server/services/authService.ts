import { connectMongo } from "@/server/db/mongoose";
import { User } from "@/server/models/User";
import { HostProfile } from "@/server/models/HostProfile";
import { GuestProfile } from "@/server/models/GuestProfile";
import { Venue } from "@/server/models/Venue";
import type { Role } from "@/server/models/_types";
import { hashPassword, verifyPassword } from "@/server/auth/password";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "@/server/auth/jwt";
import { sha256Hex } from "@/server/crypto/hash";

export async function registerUser(input: {
  email: string;
  password: string;
  mobile: string;
  role: Exclude<Role, "ADMIN">;
  firstName?: string;
  lastName?: string;
  age?: number;
  gender?: string;
  interests?: string[];
  venueName?: string;
  address?: string;
  cuisines?: string[];
  activities?: string[];
  latitude?: number;
  longitude?: number;
}) {
  await connectMongo();

  const exists = await User.findOne({ email: input.email.trim().toLowerCase() });
  if (exists) throw new Error("Email already registered");

  const passwordHash = await hashPassword(input.password);
  const user = await User.create({
    email: input.email,
    mobile: input.mobile,
    passwordHash,
    role: input.role,
    status: "PENDING"
  });

  if (input.role === "HOST") {
    const venueName = (input.venueName ?? "").trim();
    const address = (input.address ?? "").trim();
    const cuisines = input.cuisines ?? [];
    const activities = input.activities ?? [];

    const venue =
      venueName && address
        ? await Venue.create({
            hostUserId: user._id,
            name: venueName,
            address,
            foodCategories: cuisines,
            gamesAvailable: activities,
            geo:
              typeof input.latitude === "number" && typeof input.longitude === "number"
                ? { type: "Point", coordinates: [input.longitude, input.latitude] }
                : undefined
          })
        : null;

    const firstName = (input.firstName ?? "").trim();
    const lastName = (input.lastName ?? "").trim();
    const fullName = `${firstName} ${lastName}`.trim();

    await HostProfile.create({
      userId: user._id,
      venueId: venue?._id ?? null,
      firstName,
      lastName,
      age: typeof input.age === "number" ? input.age : 0,
      interests: input.interests ?? [],
      name: fullName,
      venueName,
      venueAddress: address,
      foodCategories: cuisines,
      availableGames: activities
    });
  } else {
    await GuestProfile.create({
      userId: user._id,
      firstName: (input.firstName ?? "").trim(),
      lastName: (input.lastName ?? "").trim(),
      age: typeof input.age === "number" ? input.age : 0,
      gender: (input.gender ?? "").trim()
    });
  }

  return { userId: String(user._id) };
}

export async function loginUser(input: { email: string; password: string }) {
  await connectMongo();
  const user = await User.findOne({ email: input.email.trim().toLowerCase() });
  if (!user) throw new Error("Invalid credentials");

  const ok = await verifyPassword(input.password, user.passwordHash);
  if (!ok) throw new Error("Invalid credentials");
  if (user.status === "SUSPENDED") throw new Error("Account suspended");

  const accessToken = await signAccessToken({ sub: String(user._id), role: user.role });
  const refreshToken = await signRefreshToken(String(user._id));
  const refreshTokenHash = sha256Hex(refreshToken);

  user.refreshTokens = [
    ...(user.refreshTokens ?? []),
    { tokenHash: refreshTokenHash, createdAt: new Date(), lastUsedAt: new Date() }
  ].slice(-10);
  await user.save();

  return {
    accessToken,
    refreshToken,
    role: user.role,
    status: user.status,
    userId: String(user._id)
  };
}

export async function refreshSession(refreshToken: string) {
  await connectMongo();
  const { userId } = await verifyRefreshToken(refreshToken);
  const user = await User.findById(userId);
  if (!user) throw new Error("Invalid refresh token");
  const tokenHash = sha256Hex(refreshToken);
  const entry = (user.refreshTokens ?? []).find(
    (t: { tokenHash: string }) => t.tokenHash === tokenHash
  );
  if (!entry) throw new Error("Refresh token revoked");
  entry.lastUsedAt = new Date();
  await user.save();

  const accessToken = await signAccessToken({ sub: String(user._id), role: user.role });
  return { accessToken, role: user.role, status: user.status };
}

export async function revokeRefreshToken(refreshToken: string) {
  await connectMongo();
  const { userId } = await verifyRefreshToken(refreshToken);
  const user = await User.findById(userId);
  if (!user) return;
  const tokenHash = sha256Hex(refreshToken);
  user.refreshTokens = (user.refreshTokens ?? []).filter(
    (t: { tokenHash: string }) => t.tokenHash !== tokenHash
  );
  await user.save();
}

