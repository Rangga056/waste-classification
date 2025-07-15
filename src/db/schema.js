import { mysqlTable as table } from "drizzle-orm/mysql-core";
import * as t from "drizzle-orm/mysql-core";

export const submissions = table("submissions", {
  id: t.int().primaryKey().autoincrement(),
  username: t.varchar({ length: 255 }).notNull(),
  uploadedAt: t.timestamp().defaultNow(),
});

export const submissionsImages = table("submission_img", {
  id: t.int().primaryKey().autoincrement(),
  submissionId: t.int("submission_id").references(() => submissions.id),
  imageUrl: t.varchar({ length: 255 }).notNull(),
});

export const classifications = table("classifications", {
  id: t.int().primaryKey().autoincrement(),
  imageId: t.int("image_id").references(() => submissionsImages.id),
  classificationResult: t.varchar({ length: 255 }).notNull(),
  confidence: t.double().notNull(),
  createdAt: t.timestamp().defaultNow(),
});
