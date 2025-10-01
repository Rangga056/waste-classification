import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "../db/schema.js";
import postgres from "postgres";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is not set");
}

// Disable prefetch as it is not supported for "Transaction" pool mode
export const client = postgres(connectionString, {
  prepare: false,
  idle_timeout: 20, // Tutup koneksi setelah 20 detik tidak aktif
  max_lifetime: 60 * 5, // Atur ulang koneksi setiap 5 menit
});

export const db = drizzle(client, { schema });
