import { Schema, model, models, type InferSchemaType } from "mongoose";

export type AdminRole = "SUPER_ADMIN" | "MODERATOR" | "ANALYST";

const AdminSchema = new Schema(
  {
    username: { type: String, required: true, unique: true, index: true },
    passwordHash: { type: String, required: true },
    email: { type: String, required: true, unique: true, index: true },
    fullName: { type: String, required: true },
    role: {
      type: String,
      required: true,
      enum: ["SUPER_ADMIN", "MODERATOR", "ANALYST"] satisfies AdminRole[],
      default: "ANALYST"
    },
    isActive: { type: Boolean, default: true },
    lastLoginAt: { type: Date, default: null },
    createdAt: { type: Date, default: () => new Date() },
    updatedAt: { type: Date, default: () => new Date() }
  },
  { timestamps: true }
);

AdminSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

export type AdminDoc = InferSchemaType<typeof AdminSchema>;
export const Admin = models.Admin || model("Admin", AdminSchema);

// Permission definitions
export const ADMIN_PERMISSIONS = {
  SUPER_ADMIN: {
    canViewDashboard: true,
    canManageUsers: true,
    canVerifyUsers: true,
    canSuspendUsers: true,
    canViewEvents: true,
    canManageEvents: true,
    canApproveEvents: true,
    canCancelEvents: true,
    canViewRevenue: true,
    canManageSettings: true,
    canViewAnalytics: true,
    canManageAdmins: true,
    canManageBookings: true,
    canCancelBookings: true,
    canProcessRefunds: true,
    canViewPayments: true,
    canModerateReviews: true,
    canManageVenues: true,
    canViewAuditLogs: true,
    canViewUserDetails: true
  },
  MODERATOR: {
    canViewDashboard: true,
    canManageUsers: true,
    canVerifyUsers: true,
    canSuspendUsers: true,
    canViewEvents: true,
    canManageEvents: true,
    canApproveEvents: true,
    canCancelEvents: true,
    canViewRevenue: false,
    canManageSettings: false,
    canViewAnalytics: true,
    canManageAdmins: false,
    canManageBookings: true,
    canCancelBookings: true,
    canProcessRefunds: true,
    canViewPayments: true,
    canModerateReviews: true,
    canManageVenues: true,
    canViewAuditLogs: true,
    canViewUserDetails: true
  },
  ANALYST: {
    canViewDashboard: true,
    canManageUsers: false,
    canVerifyUsers: false,
    canSuspendUsers: false,
    canViewEvents: true,
    canManageEvents: false,
    canApproveEvents: false,
    canCancelEvents: false,
    canViewRevenue: true,
    canManageSettings: false,
    canViewAnalytics: true,
    canManageAdmins: false,
    canManageBookings: false,
    canCancelBookings: false,
    canProcessRefunds: false,
    canViewPayments: true,
    canModerateReviews: false,
    canManageVenues: false,
    canViewAuditLogs: true,
    canViewUserDetails: true
  }
} as const;

export function hasPermission(role: AdminRole, permission: keyof typeof ADMIN_PERMISSIONS.SUPER_ADMIN): boolean {
  const rolePermissions = ADMIN_PERMISSIONS[role];
  if (!rolePermissions) return false;
  return rolePermissions[permission] ?? false;
}
