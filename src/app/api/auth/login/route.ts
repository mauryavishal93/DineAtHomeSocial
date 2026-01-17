import { z } from "zod";
import { cookies } from "next/headers";
import { ok, badRequest, serverError } from "@/server/http/response";
import { loginUser } from "@/server/services/authService";

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

