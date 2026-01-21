import { NextRequest } from "next/server";
import { requireAuth } from "@/server/auth/rbac";
import { connectMongo } from "@/server/db/mongoose";
import { EventTemplate } from "@/server/models/EventTemplate";
import { createResponse } from "@/server/http/response";

// Get all templates for host
export async function GET(req: NextRequest) {
  try {
    const ctx = await requireAuth(req);
    if (ctx.role !== "HOST") {
      return createResponse({ error: "Only hosts can access templates" }, { status: 403 });
    }

    await connectMongo();

    const templates = await EventTemplate.find({
      hostUserId: ctx.userId,
      isActive: true
    })
      .sort({ lastUsedAt: -1, createdAt: -1 })
      .lean();

    return createResponse({
      templates: templates.map((t: any) => ({
        id: String(t._id),
        templateName: t.templateName,
        description: t.description || "",
        eventName: t.eventName,
        theme: t.theme || "",
        durationHours: t.durationHours,
        maxGuests: t.maxGuests,
        cuisines: t.cuisines || [],
        foodTags: t.foodTags || [],
        gamesAvailable: t.gamesAvailable || [],
        basePricePerGuest: t.basePricePerGuest,
        usageCount: t.usageCount || 0,
        lastUsedAt: t.lastUsedAt || null,
        createdAt: t.createdAt
      }))
    });
  } catch (error: any) {
    return createResponse({ error: error.message }, { status: 401 });
  }
}

// Create a new template
export async function POST(req: NextRequest) {
  try {
    const ctx = await requireAuth(req);
    if (ctx.role !== "HOST") {
      return createResponse({ error: "Only hosts can create templates" }, { status: 403 });
    }

    await connectMongo();

    const body = await req.json();
    const {
      templateName,
      description,
      eventName,
      theme,
      durationHours,
      maxGuests,
      cuisines,
      foodTags,
      gamesAvailable,
      basePricePerGuest
    } = body;

    if (!templateName || !eventName || !durationHours || !maxGuests || !basePricePerGuest) {
      return createResponse({ error: "Missing required fields" }, { status: 400 });
    }

    const template = await EventTemplate.create({
      hostUserId: ctx.userId,
      templateName,
      description: description || "",
      eventName,
      theme: theme || "",
      durationHours,
      maxGuests,
      cuisines: cuisines || [],
      foodTags: foodTags || [],
      gamesAvailable: gamesAvailable || [],
      basePricePerGuest,
      usageCount: 0,
      isActive: true
    });

    return createResponse({
      success: true,
      template: {
        id: String(template._id),
        templateName: template.templateName
      }
    });
  } catch (error: any) {
    return createResponse({ error: error.message }, { status: 401 });
  }
}

// Delete a template
export async function DELETE(req: NextRequest) {
  try {
    const ctx = await requireAuth(req);
    if (ctx.role !== "HOST") {
      return createResponse({ error: "Only hosts can delete templates" }, { status: 403 });
    }

    await connectMongo();

    const url = new URL(req.url);
    const templateId = url.searchParams.get("id");

    if (!templateId) {
      return createResponse({ error: "Template ID is required" }, { status: 400 });
    }

    await EventTemplate.updateOne(
      { _id: templateId, hostUserId: ctx.userId },
      { $set: { isActive: false } }
    );

    return createResponse({ success: true });
  } catch (error: any) {
    return createResponse({ error: error.message }, { status: 401 });
  }
}
