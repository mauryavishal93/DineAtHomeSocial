import { NextRequest } from "next/server";
import { requireAuth } from "@/server/auth/rbac";
import { connectMongo } from "@/server/db/mongoose";
import { Community } from "@/server/models/Community";
import { createResponse } from "@/server/http/response";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ communityId: string }> }
) {
  try {
    const ctx = await requireAuth(req);
    await connectMongo();
    const { communityId } = await params;

    const community = await Community.findById(communityId);
    if (!community) {
      return createResponse({ error: "Community not found" }, { status: 404 });
    }

    const comm = community as any;
    
    // Check if already a member
    if (comm.members && comm.members.some((id: any) => String(id) === String(ctx.userId))) {
      return createResponse({ error: "Already a member" }, { status: 400 });
    }

    // Add user to members
    if (!comm.members) comm.members = [];
    comm.members.push(ctx.userId);
    comm.memberCount = (comm.memberCount || 0) + 1;
    await community.save();

    return createResponse({ success: true });
  } catch (error: any) {
    return createResponse({ error: error.message }, { status: 401 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ communityId: string }> }
) {
  try {
    const ctx = await requireAuth(req);
    await connectMongo();
    const { communityId } = await params;

    const community = await Community.findById(communityId);
    if (!community) {
      return createResponse({ error: "Community not found" }, { status: 404 });
    }

    const comm = community as any;
    
    // Remove user from members
    if (comm.members) {
      comm.members = comm.members.filter((id: any) => String(id) !== String(ctx.userId));
      comm.memberCount = Math.max(0, (comm.memberCount || 0) - 1);
      await community.save();
    }

    return createResponse({ success: true });
  } catch (error: any) {
    return createResponse({ error: error.message }, { status: 401 });
  }
}
