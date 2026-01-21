import { ok } from "@/server/http/response";

export const runtime = "nodejs";

export async function GET() {
  // Return the Google Maps API key for client-side use
  // This is safe because API keys are meant to be public (they're restricted by domain)
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";
  return ok({ apiKey });
}
