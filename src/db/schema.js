// src/db/schema.js
import { mysqlTable as table } from "drizzle-orm/mysql-core";
import * as t from "drizzle-orm/mysql-core";

// --- Tabel Pengguna untuk Auth.js ---
// Ini adalah definisi tabel standar yang diharapkan oleh Drizzle Adapter for Auth.js
export const users = table("users", {
  id: t.varchar("id", { length: 255 }).notNull().primaryKey(),
  name: t.varchar("name", { length: 255 }),
  email: t.varchar("email", { length: 255 }).unique(),
  emailVerified: t.timestamp("emailVerified", { mode: "string" }),
  image: t.varchar("image", { length: 255 }),
  // Tambahkan kolom peran (role)
  role: t.varchar("role", { length: 50 }).default("user").notNull(), // 'user' atau 'admin'
  // NEW: Tambahkan kolom password untuk menyimpan hash password
  password: t.varchar("password", { length: 255 }),
});

export const accounts = table(
  "accounts",
  {
    userId: t
      .varchar("userId", { length: 255 })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: t.varchar("type", { length: 255 }).notNull(),
    provider: t.varchar("provider", { length: 255 }).notNull(),
    providerAccountId: t
      .varchar("providerAccountId", { length: 255 })
      .notNull(),
    refresh_token: t.text("refresh_token"),
    access_token: t.text("access_token"),
    expires_at: t.int("expires_at"),
    // PERBAIKAN: Pastikan nama kolom di database adalah 'token_type'
    token_type: t.varchar("token_type", { length: 255 }),
    scope: t.varchar("scope", { length: 255 }),
    id_token: t.text("id_token"),
    session_state: t.varchar("session_state", { length: 255 }),
  },
  (account) => ({
    compoundKey: t.primaryKey({
      columns: [account.provider, account.providerAccountId],
    }),
  }),
);

export const sessions = table("sessions", {
  sessionToken: t
    .varchar("sessionToken", { length: 255 })
    .notNull()
    .primaryKey(),
  userId: t
    .varchar("userId", { length: 255 })
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: t.timestamp("expires", { mode: "string" }).notNull(),
});

export const verificationTokens = table(
  "verificationTokens",
  {
    identifier: t.varchar("identifier", { length: 255 }).notNull(),
    token: t.varchar("token", { length: 255 }).notNull().primaryKey(),
    expires: t.timestamp("expires", { mode: "string" }).notNull(),
  },
  (vt) => ({
    compoundKey: t.primaryKey({ columns: [vt.identifier, vt.token] }),
  }),
);
// --- Akhir Tabel Pengguna untuk Auth.js ---

export const submissions = table("submissions", {
  id: t.int().primaryKey().autoincrement(),
  userId: t
    .varchar("userId", { length: 255 })
    .notNull()
    .references(() => users.id),
  username: t.varchar("username", { length: 255 }), // Add this line
  uploadedAt: t.timestamp().defaultNow(),
});

export const submissionsImages = table("submission_img", {
  id: t.int().primaryKey().autoincrement(),
  submissionId: t.int("submission_id").references(() => submissions.id),
  imageUrl: t.varchar({ length: 255 }).notNull(),
  status: t.varchar({ length: 50 }).default("Pending").notNull(),
});

export const classifications = table("classifications", {
  id: t.int().primaryKey().autoincrement(),
  imageId: t.int("image_id").references(() => submissionsImages.id),
  classificationResult: t.varchar({ length: 255 }).notNull(),
  confidence: t.double().notNull(),
  createdAt: t.timestamp().defaultNow(),
  wasteCount: t.int("waste_count"),
});
