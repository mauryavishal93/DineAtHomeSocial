import { ok, unauthorized, serverError } from "@/server/http/response";
import { loginAdmin } from "@/server/services/adminAuthService";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { username, password } = body as { username?: string; password?: string };

    if (!username || !password) {
      return serverError("Username and password required");
    }

    const result = await loginAdmin({ username, password });
    return ok(result);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    // Log error for debugging
    console.error("Admin login error:", msg, e);
    
    // Return 401 for authentication/authorization errors
    const lowerMsg = msg.toLowerCase();
    if (
      lowerMsg.includes("invalid") || 
      lowerMsg.includes("credentials") || 
      lowerMsg.includes("password") ||
      lowerMsg.includes("not found") ||
      lowerMsg.includes("inactive")
    ) {
      return unauthorized(msg); // Include the specific error message
    }
    
    // Return 500 for other errors (like model not initialized, no users found)
    return serverError(msg);
  }
}
