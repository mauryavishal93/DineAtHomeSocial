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

export async function connectMongo() {
  if (globalCache.conn) return globalCache.conn;
  if (!globalCache.promise) {
    globalCache.promise = mongoose
      .connect(env.MONGODB_URI, {
        autoIndex: true
      })
      .then((m) => m);
  }
  globalCache.conn = await globalCache.promise;
  return globalCache.conn;
}

