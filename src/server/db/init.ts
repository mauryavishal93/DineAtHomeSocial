import mongoose from "mongoose";
import type { Model } from "mongoose";

import { connectMongo } from "@/server/db/mongoose";

import { AdminAction } from "@/server/models/AdminAction";
import { Booking } from "@/server/models/Booking";
import { EventSlot } from "@/server/models/EventSlot";
import { Feedback } from "@/server/models/Feedback";
import { GuestProfile } from "@/server/models/GuestProfile";
import { HostProfile } from "@/server/models/HostProfile";
import { Payment } from "@/server/models/Payment";
import { PricingRule } from "@/server/models/PricingRule";
import { User } from "@/server/models/User";
import { Venue } from "@/server/models/Venue";

function isNamespaceExistsError(err: unknown) {
  if (!err || typeof err !== "object") return false;
  const anyErr = err as { code?: unknown; codeName?: unknown; message?: unknown };
  return (
    anyErr.code === 48 ||
    anyErr.codeName === "NamespaceExists" ||
    (typeof anyErr.message === "string" && anyErr.message.includes("NamespaceExists"))
  );
}

export async function initMongoCollections() {
  await connectMongo();

  const models: Model<unknown>[] = [
    User,
    GuestProfile,
    HostProfile,
    Venue,
    EventSlot,
    Booking,
    Payment,
    Feedback,
    PricingRule,
    AdminAction
  ];

  const results = [];
  for (const m of models) {
    const modelName = m.modelName;
    const collectionName = m.collection.name;

    let collectionEnsured = false;
    try {
      await m.createCollection();
      collectionEnsured = true;
    } catch (e) {
      if (!isNamespaceExistsError(e)) throw e;
    }

    // Creates missing indexes from schema definitions (does not drop existing indexes).
    await m.createIndexes();

    results.push({ modelName, collectionName, collectionEnsured });
  }

  return {
    dbName: mongoose.connection.name,
    collectionCount: results.length,
    collections: results
  };
}

