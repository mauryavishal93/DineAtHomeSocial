import mongoose from "mongoose";
import { env } from "@/server/env";

declare global {
  // eslint-disable-next-line no-var
  var __mongooseConn: {
    conn: typeof mongoose | null;
    promise: Promise<typeof mongoose> | null;
  } | null;
}

const globalCache =
  global.__mongooseConn ?? (global.__mongooseConn = { conn: null, promise: null });

/** Remove legacy referralCode: "" so sparse unique index allows multiple unset codes */
async function cleanupEmptyReferralCodes(db: import("mongodb").Db) {
  try {
    const [gr, hr] = await Promise.all([
      db.collection("guestprofiles").updateMany({ referralCode: "" }, { $unset: { referralCode: "" } }),
      db.collection("hostprofiles").updateMany({ referralCode: "" }, { $unset: { referralCode: "" } })
    ]);
    const n = (gr.modifiedCount ?? 0) + (hr.modifiedCount ?? 0);
    if (n > 0) {
      console.log(`[mongo] Unset empty referralCode on ${n} profile document(s)`);
    }
  } catch (e) {
    console.warn("[mongo] referralCode cleanup skipped:", e);
  }
}

export async function connectMongo() {
  if (globalCache.conn) return globalCache.conn;
  if (!globalCache.promise) {
    globalCache.promise = mongoose
      .connect(env.MONGODB_URI, {
        autoIndex: true
      })
      .then(async (m) => {
        const db = m.connection.db;
        if (db) await cleanupEmptyReferralCodes(db);
        return m;
      });
  }
  globalCache.conn = await globalCache.promise;
  return globalCache.conn;
}

