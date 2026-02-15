import { z } from "zod";
import { cookies } from "next/headers";
import { ok, badRequest, serverError, tooManyRequests } from "@/server/http/response";
import { loginUser } from "@/server/services/authService";
import { loginRateLimit } from "@/server/utils/rateLimit";
import { connectMongo } from "@/server/db/mongoose";
import { User } from "@/server/models/User";
import { HostProfile } from "@/server/models/HostProfile";
import { GuestProfile } from "@/server/models/GuestProfile";
import type { Role } from "@/server/models/_types";

// Check profile completeness
async function checkProfileCompleteness(userId: string, role: Role): Promise<{ complete: boolean; missingFields: string[] }> {
  const missingFields: string[] = [];
  
  if (role === "GUEST") {
    const profile = await GuestProfile.findOne({ userId }).lean() as any;
    const user = await User.findById(userId).lean() as any;
    if (!profile) {
      missingFields.push("profile");
      return { complete: false, missingFields };
    }
    if (!profile.firstName || !profile.lastName) missingFields.push("name");
    if (!profile.age || profile.age === 0) missingFields.push("age");
    if (!profile.gender) missingFields.push("gender");
    if (!user?.mobile) missingFields.push("mobile");
  } else if (role === "HOST") {
    const profile = await HostProfile.findOne({ userId }).lean() as any;
    if (!profile) {
      missingFields.push("profile");
      return { complete: false, missingFields };
    }
    if (!profile.firstName || !profile.lastName) missingFields.push("name");
    if (!profile.venueName) missingFields.push("venueName");
    if (!profile.venueAddress) missingFields.push("venueAddress");
    if (!profile.governmentIdPath) missingFields.push("governmentId");
  }
  
  return { complete: missingFields.length === 0, missingFields };
}

export const runtime = "nodejs";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

export async function POST(req: Request) {
  try {
    const json = await req.json().catch(() => null);
    const parsed = schema.safeParse(json);
    if (!parsed.success) return badRequest(parsed.error.message);

    // Rate limiting: Get IP address from request
    const forwarded = req.headers.get("x-forwarded-for");
    const ip = forwarded ? forwarded.split(",")[0] : req.headers.get("x-real-ip") || "unknown";
    const rateLimitKey = `login:${parsed.data.email}:${ip}`;
    
    const rateLimitResult = loginRateLimit(rateLimitKey);
    if (!rateLimitResult.allowed) {
      return tooManyRequests(
        `Too many login attempts. Please try again after ${Math.ceil((rateLimitResult.resetAt - Date.now()) / 1000 / 60)} minutes.`
      );
    }

    const { accessToken, refreshToken, role, status, userId } = await loginUser(parsed.data);

    // Store refresh in httpOnly cookie for browser clients (mobile can store in secure storage).
    const jar = await cookies();
    jar.set("refresh_token", refreshToken, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 30
    });

    // Check profile completeness (only for GUEST and HOST, not ADMIN)
    let profileComplete = true;
    let redirectTo = "/";
    
    if (role !== "ADMIN") {
      await connectMongo();
      const profileCheck = await checkProfileCompleteness(userId, role);
      profileComplete = profileCheck.complete;
      redirectTo = profileComplete 
        ? "/" 
        : role === "HOST" 
          ? `/hosts/${userId}/edit` 
          : "/profile";
    }

    return ok({ 
      accessToken, 
      role, 
      status,
      profileComplete,
      redirectTo,
      userId
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Login failed";
    if (msg.toLowerCase().includes("invalid") || msg.toLowerCase().includes("suspend")) {
      return badRequest(msg);
    }
    return serverError(msg);
  }
}

