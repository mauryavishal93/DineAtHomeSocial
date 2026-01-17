import { cookies } from "next/headers";
import { ok, unauthorized } from "@/server/http/response";
import { refreshSession } from "@/server/services/authService";

export const runtime = "nodejs";

export async function POST() {
  const jar = await cookies();
  const token = jar.get("refresh_token")?.value;
  if (!token) return unauthorized("Missing refresh token");
  try {
    const res = await refreshSession(token);
    return ok(res);
  } catch {
    return unauthorized("Invalid refresh token");
  }
}

