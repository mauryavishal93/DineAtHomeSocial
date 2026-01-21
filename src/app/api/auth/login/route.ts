import { z } from "zod";
import { cookies } from "next/headers";
import { ok, badRequest, serverError, tooManyRequests } from "@/server/http/response";
import { loginUser } from "@/server/services/authService";
import { loginRateLimit } from "@/server/utils/rateLimit";

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

    const { accessToken, refreshToken, role, status } = await loginUser(parsed.data);

    // Store refresh in httpOnly cookie for browser clients (mobile can store in secure storage).
    const jar = await cookies();
    jar.set("refresh_token", refreshToken, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 30
    });

    return ok({ accessToken, role, status });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Login failed";
    if (msg.toLowerCase().includes("invalid") || msg.toLowerCase().includes("suspend")) {
      return badRequest(msg);
    }
    return serverError(msg);
  }
}

