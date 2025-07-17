// /lib/submissions.actions.js
"use server";

import { db } from "@/db/db";
import { submissions, submissionsImages, classifications } from "@/db/schema";
import { eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";

export async function deleteSubmission(submissionId) {
  const session = await getServerSession(authOptions);

  // Dapatkan detail submission yang akan dihapus
  const [submissionToDelete] = await db
    .select({ userId: submissions.userId })
    .from(submissions)
    .where(eq(submissions.id, submissionId));

  // Proteksi:
  // 1. Pastikan pengguna terautentikasi
  // 2. Jika bukan admin, pastikan userId sesi cocok dengan userId submission
  if (!session || !session.user) {
    console.error("Akses ditolak: Pengguna tidak terautentikasi.");
    return {
      error: "Unauthorized: You must be logged in to perform this action.",
    };
  }

  if (
    session.user.role !== "admin" &&
    session.user.id !== submissionToDelete?.userId
  ) {
    console.error(
      "Akses ditolak: Anda tidak memiliki izin untuk menghapus submission ini."
    );
    return { error: "Forbidden: You can only delete your own submissions." };
  }

  try {
    const images = await db
      .select()
      .from(submissionsImages)
      .where(eq(submissionsImages.submissionId, submissionId));

    const imageIds = images.map((img) => img.id);

    if (imageIds.length) {
      await db
        .delete(classifications)
        .where(inArray(classifications.imageId, imageIds));
    }

    await db
      .delete(submissionsImages)
      .where(eq(submissionsImages.submissionId, submissionId));

    await db.delete(submissions).where(eq(submissions.id, submissionId));

    revalidatePath("/submissions");
    revalidatePath("/admin/dashboard");
    revalidatePath("/admin/users");
    revalidatePath("/admin/classification");

    return { success: true };
  } catch (error) {
    console.error("Error deleting submission:", error);
    return { error: "Gagal menghapus submission." };
  }
}
