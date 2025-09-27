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
  max: 1, // Limit connections for serverless environments
});

export const db = drizzle(client, { schema });
