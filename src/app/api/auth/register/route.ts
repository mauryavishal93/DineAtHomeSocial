import { z } from "zod";
import { created, badRequest, serverError } from "@/server/http/response";
import { registerUser } from "@/server/services/authService";

export const runtime = "nodejs";

const guestSchema = z.object({
  role: z.literal("GUEST"),
  firstName: z.string().min(1).max(40),
  lastName: z.string().min(1).max(40),
  age: z.coerce.number().int().min(0).max(99),
  gender: z.enum(["Male", "Female", "Other"]),
  email: z.string().email(),
  password: z.string().min(8),
  mobile: z.string().regex(/^\d{10}$/, "Mobile must be exactly 10 digits")
});

const hostSchema = z.object({
  role: z.literal("HOST"),
  firstName: z.string().min(1).max(40),
  lastName: z.string().min(1).max(40),
  age: z.coerce.number().int().min(0).max(99),
  venueName: z.string().min(1).max(120),
  address: z.string().min(1).max(240),
  latitude: z.coerce.number().min(-90).max(90).optional(),
  longitude: z.coerce.number().min(-180).max(180).optional(),
  interests: z
    .union([z.array(z.string().min(1).max(40)), z.string()])
    .optional()
    .transform((v) => {
      if (!v) return [];
      if (Array.isArray(v)) return v;
      return v
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    }),
  cuisines: z
    .union([z.array(z.string().min(1).max(60)), z.string()])
    .transform((v) => {
      if (Array.isArray(v)) return v;
      return v
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    }),
  activities: z
    .union([z.array(z.string().min(1).max(60)), z.string()])
    .transform((v) => {
      if (Array.isArray(v)) return v;
      return v
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    }),
  email: z.string().email(),
  password: z.string().min(8),
  mobile: z.string().regex(/^\d{10}$/, "Mobile must be exactly 10 digits")
});

const schema = z.discriminatedUnion("role", [guestSchema, hostSchema]);

export async function POST(req: Request) {
  try {
    const json = await req.json().catch(() => null);
    const parsed = schema.safeParse(json);
    if (!parsed.success) return badRequest(parsed.error.message);
    const res = await registerUser(parsed.data);
    return created(res);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to register";
    if (msg.toLowerCase().includes("already")) return badRequest(msg);
    return serverError(msg);
  }
}

