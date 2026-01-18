import { connectMongo } from "@/server/db/mongoose";
import { Admin, type AdminRole } from "@/server/models/Admin";
import { hashPassword, verifyPassword } from "@/server/auth/password";
import { signAccessToken } from "@/server/auth/jwt";

export interface AdminSession {
  adminId: string;
  username: string;
  role: AdminRole;
  fullName: string;
}

export async function loginAdmin(input: { username: string; password: string }): Promise<{
  accessToken: string;
  admin: {
    id: string;
    username: string;
    role: AdminRole;
    fullName: string;
    email: string;
  };
}> {
  await connectMongo();

  // Check if Admin model is properly initialized
  if (!Admin) {
    throw new Error("Admin model not initialized. Please ensure the Admin model is properly imported.");
  }

  // Check if any admin users exist
  const adminCount = await Admin.countDocuments();
  if (adminCount === 0) {
    throw new Error("No admin users found. Please initialize admin users by calling /api/admin/init first.");
  }

  const admin = await Admin.findOne({ username: input.username });
  
  if (!admin) {
    throw new Error(`Admin user not found with username: ${input.username}. Please check your username or initialize admin users.`);
  }

  if (!admin.isActive) {
    throw new Error(`Admin account for username: ${input.username} is inactive. Please contact a super administrator.`);
  }

  const ok = await verifyPassword(input.password, admin.passwordHash);
  if (!ok) {
    throw new Error(`Invalid password for username: ${input.username}. Please check your password.`);
  }

  // Update last login
  admin.lastLoginAt = new Date();
  await admin.save();

  const accessToken = await signAccessToken({
    sub: String(admin._id),
    role: "ADMIN",
    adminRole: admin.role,
    username: admin.username
  });

  return {
    accessToken,
    admin: {
      id: String(admin._id),
      username: admin.username,
      role: admin.role,
      fullName: admin.fullName,
      email: admin.email
    }
  };
}

export async function createAdmin(input: {
  username: string;
  password: string;
  email: string;
  fullName: string;
  role: AdminRole;
}): Promise<{ adminId: string; username: string }> {
  await connectMongo();

  const exists = await Admin.findOne({
    $or: [{ username: input.username }, { email: input.email }]
  });
  if (exists) throw new Error("Username or email already exists");

  const passwordHash = await hashPassword(input.password);
  const admin = await Admin.create({
    username: input.username,
    passwordHash,
    email: input.email,
    fullName: input.fullName,
    role: input.role,
    isActive: true
  });

  return {
    adminId: String(admin._id),
    username: admin.username
  };
}

export async function getAdminById(adminId: string) {
  await connectMongo();
  const admin = await Admin.findById(adminId).lean() as { _id: any; username: string; role: AdminRole; fullName: string; email: string; isActive: boolean; lastLoginAt: Date | null } | null;
  if (!admin) return null;
  return {
    id: String(admin._id),
    username: admin.username,
    role: admin.role,
    fullName: admin.fullName,
    email: admin.email,
    isActive: admin.isActive,
    lastLoginAt: admin.lastLoginAt
  };
}
