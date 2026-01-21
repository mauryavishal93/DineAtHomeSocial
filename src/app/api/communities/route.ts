import { NextRequest } from "next/server";
import { requireAuth } from "@/server/auth/rbac";
import { connectMongo } from "@/server/db/mongoose";
import { Community } from "@/server/models/Community";
import { EventSlot } from "@/server/models/EventSlot";
import { User } from "@/server/models/User";
import { createResponse } from "@/server/http/response";

// Get all communities
export async function GET(req: NextRequest) {
  try {
    await connectMongo();

    const url = new URL(req.url);
    const category = url.searchParams.get("category");
    const search = url.searchParams.get("search");

    const query: any = { isActive: true };
    if (category) {
      query.category = category;
    }
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { tags: { $regex: search, $options: "i" } }
      ];
    }

    const communities = await Community.find(query)
      .populate({ path: "creatorUserId", select: "name" })
      .sort({ memberCount: -1, createdAt: -1 })
      .limit(50)
      .lean();

    return createResponse({
      communities: communities.map((comm: any) => ({
        id: String(comm._id),
        name: comm.name,
        description: comm.description,
        category: comm.category,
        tags: comm.tags || [],
        creatorName: comm.creatorUserId?.name || "Unknown",
        memberCount: comm.memberCount || 0,
        isPrivate: comm.isPrivate || false,
        imageUrl: comm.imageUrl || "",
        createdAt: comm.createdAt
      }))
    });
  } catch (error: any) {
    return createResponse({ error: error.message }, { status: 500 });
  }
}

// Create a community
export async function POST(req: NextRequest) {
  try {
    const ctx = await requireAuth(req);
    await connectMongo();

    const body = await req.json();
    const { name, description, category, tags, isPrivate, imageUrl } = body;

    if (!name || !category) {
      return createResponse({ error: "Name and category are required" }, { status: 400 });
    }

    const community = await Community.create({
      name,
      description: description || "",
      category,
      tags: tags || [],
      creatorUserId: ctx.userId,
      moderators: [ctx.userId],
      members: [ctx.userId],
      memberCount: 1,
      isPrivate: isPrivate || false,
      imageUrl: imageUrl || "",
      isActive: true
    });

    return createResponse({
      success: true,
      community: {
        id: String(community._id),
        name: community.name,
        description: community.description,
        category: community.category,
        tags: community.tags,
        memberCount: community.memberCount
      }
    });
  } catch (error: any) {
    return createResponse({ error: error.message }, { status: 401 });
  }
}
