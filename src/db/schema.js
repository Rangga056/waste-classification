//NOTE: Migrate to supabase
// src/db/schema.js
import {
  pgTable as table,
  serial,
  varchar,
  timestamp,
  integer,
  doublePrecision,
  text,
  primaryKey,
} from "drizzle-orm/pg-core";

// --- Tabel Pengguna untuk Auth.js ---
export const users = table("users", {
  id: varchar("id", { length: 255 }).notNull().primaryKey(),
  name: varchar("name", { length: 255 }),
  email: varchar("email", { length: 255 }).unique(),
  emailVerified: timestamp("emailVerified", { mode: "string" }),
  image: varchar("image", { length: 255 }),
  role: varchar("role", { length: 50 }).default("user").notNull(),
  password: varchar("password", { length: 255 }),
});

export const accounts = table(
  "accounts",
  {
    userId: varchar("userId", { length: 255 })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: varchar("type", { length: 255 }).notNull(),
    provider: varchar("provider", { length: 255 }).notNull(),
    providerAccountId: varchar("providerAccountId", { length: 255 }).notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: varchar("token_type", { length: 255 }),
    scope: varchar("scope", { length: 255 }),
    id_token: text("id_token"),
    session_state: varchar("session_state", { length: 255 }),
  },
  (account) => ({
    compoundKey: primaryKey({
      columns: [account.provider, account.providerAccountId],
    }),
  }),
);

export const sessions = table("sessions", {
  sessionToken: varchar("sessionToken", { length: 255 }).notNull().primaryKey(),
  userId: varchar("userId", { length: 255 })
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "string" }).notNull(),
});

export const verificationTokens = table(
  "verificationTokens",
  {
    identifier: varchar("identifier", { length: 255 }).notNull(),
    token: varchar("token", { length: 255 }).notNull(), // .primaryKey() telah dihapus
    expires: timestamp("expires", { mode: "string" }).notNull(),
  },
  (vt) => ({
    compoundKey: primaryKey({ columns: [vt.identifier, vt.token] }),
  }),
);
export const submissions = table("submissions", {
  id: serial("id").primaryKey(),
  userId: varchar("userId", { length: 255 })
    .notNull()
    .references(() => users.id),
  username: varchar("username", { length: 255 }),
  uploadedAt: timestamp("uploadedAt").defaultNow(),
});

export const submissionsImages = table("submission_img", {
  id: serial("id").primaryKey(),
  submissionId: integer("submission_id").references(() => submissions.id),
  imageUrl: varchar("imageUrl", { length: 255 }).notNull(),
  status: varchar("status", { length: 50 }).default("Pending").notNull(),
});

export const classifications = table("classifications", {
  id: serial("id").primaryKey(),
  imageId: integer("image_id").references(() => submissionsImages.id),
  classificationResult: varchar("classificationResult", {
    length: 255,
  }).notNull(),
  confidence: doublePrecision("confidence").notNull(),
  createdAt: timestamp("createdAt").defaultNow(),
  wasteCount: integer("waste_count"),
});
