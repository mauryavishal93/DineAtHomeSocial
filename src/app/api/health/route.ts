import { ok } from "@/server/http/response";

export const runtime = "nodejs";

export async function GET() {
  return ok({ status: "ok" });
}

