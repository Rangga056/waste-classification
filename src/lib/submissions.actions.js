// /lib/submissions.actions.js
"use server";

import { db } from "@/db/db";
import { submissions, submissionsImages, classifications } from "@/db/schema";
import { eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function deleteSubmission(submissionId) {
  // Find images linked to this submission
  const images = await db
    .select()
    .from(submissionsImages)
    .where(eq(submissionsImages.submissionId, submissionId));

  const imageIds = images.map((img) => img.id);

  // Optional: delete classifications for those images
  if (imageIds.length) {
    await db
      .delete(classifications)
      .where(inArray(classifications.imageId, imageIds));
  }

  // Delete images
  await db
    .delete(submissionsImages)
    .where(eq(submissionsImages.submissionId, submissionId));

  // Delete the submission
  await db.delete(submissions).where(eq(submissions.id, submissionId));

  // Revalidate list page
  revalidatePath("/submissions");
}
