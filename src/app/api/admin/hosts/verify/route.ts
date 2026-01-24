import { ok, badRequest, forbidden, unauthorized, serverError } from "@/server/http/response";
import { requireAuth, requireRole } from "@/server/auth/rbac";
import { connectMongo } from "@/server/db/mongoose";
import { HostProfile } from "@/server/models/HostProfile";
import { User } from "@/server/models/User";
import { AdminAction } from "@/server/models/AdminAction";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const ctx = await requireAuth(req as unknown as { headers: Headers });
    requireRole(ctx, ["ADMIN"]);

    const json = await req.json().catch(() => null);
    const { userId } = json || {};

    if (!userId) {
      return badRequest("User ID is required");
    }

    await connectMongo();

    const profile = await HostProfile.findOne({ userId }).lean();
    if (!profile) {
      return badRequest("Host profile not found");
    }

    if (!(profile as any).governmentIdPath) {
      return badRequest("Host has not uploaded a government ID");
    }

    // Update host profile verification status
    await HostProfile.findOneAndUpdate(
      { userId },
      {
        $set: {
          isIdentityVerified: true,
          verificationDate: new Date(),
          verifiedBy: ctx.userId
        }
      }
    );

    // Update user status to VERIFIED
    await User.findByIdAndUpdate(
      userId,
      {
        $set: {
          status: "VERIFIED"
        }
      }
    );

    // Log admin action
    await AdminAction.create({
      adminUserId: ctx.userId,
      adminUsername: ctx.username || "Admin",
      actionType: "VERIFY_HOST_IDENTITY",
      targetType: "USER",
      targetId: userId,
      targetUserId: userId,
      description: "Verified host identity and updated user status to VERIFIED"
    });

    return ok({ message: "Host verified successfully. User status updated to VERIFIED." });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to verify host";
    if (msg.toLowerCase().includes("forbidden")) return forbidden();
    if (msg.toLowerCase().includes("missing token") || msg.toLowerCase().includes("invalid"))
      return unauthorized();
    return serverError(msg);
  }
}
