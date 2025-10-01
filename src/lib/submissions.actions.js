// /lib/submissions.actions.js
"use server";

import { db } from "@/db/db";
import { submissions, submissionsImages, classifications } from "@/db/schema";
import { eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin"; // Gunakan klien admin

export async function deleteSubmission(submissionId) {
  const session = await auth();

  const [submissionToDelete] = await db
    .select({ userId: submissions.userId })
    .from(submissions)
    .where(eq(submissions.id, submissionId));

  if (!session || !session.user) {
    return {
      error: "Unauthorized: You must be logged in to perform this action.",
    };
  }

  if (
    session.user.role !== "admin" &&
    session.user.id !== submissionToDelete?.userId
  ) {
    return { error: "Forbidden: You can only delete your own submissions." };
  }

  try {
    const images = await db
      .select({
        id: submissionsImages.id,
        imageUrl: submissionsImages.imageUrl,
      })
      .from(submissionsImages)
      .where(eq(submissionsImages.submissionId, submissionId));

    if (images.length > 0) {
      // Hapus file dari Supabase Storage
      const filePaths = images.map((image) => {
        // Ekstrak path file dari URL lengkap
        const urlParts = image.imageUrl.split("/waste-images/");
        return urlParts[1];
      });

      const { error: storageError } = await supabaseAdmin.storage
        .from("waste-images")
        .remove(filePaths);

      if (storageError) {
        console.error("Storage Deletion Error:", storageError.message);
        // Anda bisa memilih untuk menghentikan proses jika gagal hapus file
        // atau tetap melanjutkan untuk menghapus data dari DB.
      }

      const imageIds = images.map((img) => img.id);
      await db
        .delete(classifications)
        .where(inArray(classifications.imageId, imageIds));
    }

    // Hapus data dari database
    await db
      .delete(submissionsImages)
      .where(eq(submissionsImages.submissionId, submissionId));
    await db.delete(submissions).where(eq(submissions.id, submissionId));

    revalidatePath("/submissions");
    revalidatePath("/admin/dashboard");

    return { success: true };
  } catch (error) {
    console.error("Error deleting submission:", error);
    return { error: "Gagal menghapus submission." };
  }
}
