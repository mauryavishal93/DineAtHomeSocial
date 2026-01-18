import { ok, serverError } from "@/server/http/response";
import { createAdmin } from "@/server/services/adminAuthService";

export const runtime = "nodejs";

// Initialize admin users - run once to create default admins
export async function POST(req: Request) {
  try {
    const admins = [
      {
        username: "superadmin",
        password: "SuperAdmin@2024!",
        email: "superadmin@dineathome.com",
        fullName: "Super Administrator",
        role: "SUPER_ADMIN" as const
      },
      {
        username: "moderator",
        password: "Moderator@2024!",
        email: "moderator@dineathome.com",
        fullName: "Content Moderator",
        role: "MODERATOR" as const
      },
      {
        username: "analyst",
        password: "Analyst@2024!",
        email: "analyst@dineathome.com",
        fullName: "Data Analyst",
        role: "ANALYST" as const
      }
    ];

    const results = [];
    for (const adminData of admins) {
      try {
        const result = await createAdmin(adminData);
        results.push({
          username: result.username,
          password: adminData.password,
          role: adminData.role,
          status: "created"
        });
      } catch (error) {
        results.push({
          username: adminData.username,
          password: adminData.password,
          role: adminData.role,
          status: "exists",
          error: error instanceof Error ? error.message : "Unknown error"
        });
      }
    }

    return ok({
      message: "Admin users initialization completed",
      admins: results
    });
  } catch (e) {
    return serverError(e instanceof Error ? e.message : "Failed to initialize admins");
  }
}
