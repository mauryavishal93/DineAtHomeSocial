import { ok, serverError } from "@/server/http/response";
import { connectMongo } from "@/server/db/mongoose";
import { Admin } from "@/server/models/Admin";

export const runtime = "nodejs";

// Test endpoint to verify Admin model and users
export async function GET() {
  try {
    // Test database connection
    await connectMongo();
    
    // Check if Admin model is initialized
    let modelStatus = "OK";
    let modelError = null;
    try {
      if (!Admin) {
        modelStatus = "FAILED";
        modelError = "Admin model is not defined";
      } else {
        // Try to access model methods
        const count = await Admin.countDocuments();
        modelStatus = "OK";
      }
    } catch (error) {
      modelStatus = "FAILED";
      modelError = error instanceof Error ? error.message : "Unknown error";
    }

    // Get admin users count
    let adminCount = 0;
    let admins: Array<{ username: string; role: string; isActive: boolean; email: string }> = [];
    
    try {
      adminCount = await Admin.countDocuments();
      const adminList = await Admin.find({}).select("username role isActive email").lean();
      admins = adminList.map((a) => ({
        username: a.username,
        role: a.role,
        isActive: a.isActive ?? true,
        email: a.email
      }));
    } catch (error) {
      // Error already caught above
    }

    // Check database connection
    const mongoose = await import("mongoose");
    const dbStatus = mongoose.default.connection.readyState === 1 ? "CONNECTED" : "NOT CONNECTED";

    return ok({
      status: "OK",
      checks: {
        database: {
          status: dbStatus,
          readyState: mongoose.default.connection.readyState
        },
        model: {
          status: modelStatus,
          error: modelError,
          modelName: Admin?.modelName || "N/A"
        },
        admins: {
          count: adminCount,
          users: admins,
          hasUsers: adminCount > 0,
          message: adminCount === 0 
            ? "No admin users found. Call POST /api/admin/init to create default admin users."
            : `${adminCount} admin user(s) found.`
        }
      },
      instructions: {
        initialize: "To create admin users, call: POST /api/admin/init",
        login: "To login, use: POST /api/admin/auth/login with username and password",
        defaultCredentials: {
          superadmin: { username: "superadmin", password: "SuperAdmin@2024!" },
          moderator: { username: "moderator", password: "Moderator@2024!" },
          analyst: { username: "analyst", password: "Analyst@2024!" }
        }
      }
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return serverError(`Test endpoint error: ${msg}`);
  }
}
