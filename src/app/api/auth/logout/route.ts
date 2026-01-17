import { cookies } from "next/headers";
import { ok } from "@/server/http/response";
import { revokeRefreshToken } from "@/server/services/authService";

export const runtime = "nodejs";

export async function POST() {
  const jar = await cookies();
  const token = jar.get("refresh_token")?.value;
  if (token) await revokeRefreshToken(token);
  jar.set("refresh_token", "", { httpOnly: true, path: "/", maxAge: 0 });
  return ok({ loggedOut: true });
}

