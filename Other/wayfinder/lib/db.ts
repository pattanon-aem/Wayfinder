import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error("Please define the MONGODB_URI environment variable");
}

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

const cached: MongooseCache = (
  global as typeof globalThis & { mongoose?: MongooseCache }
).mongoose || { conn: null, promise: null };

export async function connectToDatabase() {
  if (cached.conn) return cached.conn;
  if (!cached.promise) {
    cached.promise = (async () => {
      try {
        try {
          const url = new URL(MONGODB_URI!);
          const host = url.hostname || "unknown-host";
        } catch (e) {}

        const m = await mongoose.connect(MONGODB_URI!, {
          bufferCommands: false,
        });
        return m;
      } catch (err) {
        console.error("[mongo] connection error -- full error follows:");
        console.error(err);
        throw err;
      }
    })();
  }
  cached.conn = await cached.promise;
  (global as typeof globalThis & { mongoose?: MongooseCache }).mongoose =
    cached;
  return cached.conn;
}
