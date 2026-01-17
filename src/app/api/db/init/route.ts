import { ok, serverError } from "@/server/http/response";
import { initMongoCollections } from "@/server/db/init";

export const runtime = "nodejs";

export async function POST() {
  try {
    const res = await initMongoCollections();
    return ok(res);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to init database";
    return serverError(msg);
  }
}

export async function GET() {
  return POST();
}

