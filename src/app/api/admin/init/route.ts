import { badRequest, created, forbidden, ok, serverError } from "@/server/http/response";
import { Admin } from "@/server/models/Admin";
import { createAdmin } from "@/server/services/adminAuthService";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

function getHeader(req: Request, name: string) {
  return req.headers.get(name) ?? req.headers.get(name.toLowerCase());
}

function getProvidedSecret(req: Request): string {
  const fromHeader = getHeader(req, "x-admin-init-secret") || "";
  const url = new URL(req.url);
  const fromQuery = url.searchParams.get("x-admin-init-secret") || "";
  return (fromHeader || fromQuery).trim();
}

const isProduction = process.env.NODE_ENV === "production";
const DEV_INIT_SECRET = "dev-admin-init-secret";

export async function POST(req: Request) {
  try {
    const initSecret = (
      process.env.ADMIN_INIT_SECRET || (isProduction ? "" : DEV_INIT_SECRET)
    ).trim();
    const providedSecret = getProvidedSecret(req);

    if (!initSecret) {
      return serverError(
        "ADMIN_INIT_SECRET is not set on server. Set it in Render env vars before calling this endpoint."
      );
    }
    if (providedSecret !== initSecret) {
      return forbidden(
        "Invalid init secret. Set ADMIN_INIT_SECRET in Render env vars, then send the same value in the request header: x-admin-init-secret, or in the query: ?x-admin-init-secret=YOUR_SECRET"
      );
    }

    const adminCount = await Admin.countDocuments();
    if (adminCount > 0) {
      return ok({ alreadyInitialized: true, adminCount });
    }

    let body: any = {};
    try {
      body = await req.json();
    } catch {
      // allow empty body (use env defaults)
    }

    const username = (body.username ?? process.env.ADMIN_DEFAULT_USERNAME ?? "").trim();
    const password = (body.password ?? process.env.ADMIN_DEFAULT_PASSWORD ?? "").trim();
    const email = (body.email ?? process.env.ADMIN_DEFAULT_EMAIL ?? "").trim();
    const fullName = (body.fullName ?? process.env.ADMIN_DEFAULT_FULLNAME ?? "Super Admin").trim();
    const role = (body.role ?? process.env.ADMIN_DEFAULT_ROLE ?? "SUPER_ADMIN").trim();

    if (!username || !password || !email) {
      return badRequest(
        "Missing admin bootstrap fields. Provide JSON { username, password, email } or set env vars ADMIN_DEFAULT_USERNAME, ADMIN_DEFAULT_PASSWORD, ADMIN_DEFAULT_EMAIL."
      );
    }

    const res = await createAdmin({
      username,
      password,
      email,
      fullName,
      role: role === "MODERATOR" || role === "ANALYST" ? role : "SUPER_ADMIN"
    });

    return created({ ...res, alreadyInitialized: false });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to init admin";
    return serverError(msg);
  }
}

export async function GET(req: Request) {
  return POST(req);
}

