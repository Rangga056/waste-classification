// src/app/api/submissions-status/route.js
import { db } from "@/db/db";
import {
  submissions,
  submissionsImages,
  classifications,
  users,
} from "@/db/schema";
import { desc, eq, count, inArray, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { auth } from "@/auth";

export async function GET() {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return new Response(
        JSON.stringify({ message: "Tidak terautentikasi." }),
        {
          status: 401,
        },
      );
    }

    const { user } = session;

    // 1. Ambil submission yang relevan (semua untuk admin, hanya milik sendiri untuk user)
    const userSubmissions = await db
      .select({
        id: submissions.id,
        userId: submissions.userId,
        username: submissions.username,
        uploadedAt: submissions.uploadedAt,
      })
      .from(submissions)
      .where(
        user.role === "admin" ? undefined : eq(submissions.userId, user.id),
      )
      .orderBy(desc(submissions.uploadedAt));

    if (userSubmissions.length === 0) {
      return NextResponse.json({
        allSubmissions: [],
        previewDataArray: [],
        imageCountArray: [],
      });
    }

    const submissionIds = userSubmissions.map((s) => s.id);

    // 2. Ambil semua data terkait dalam beberapa kueri efisien
    const allImages = await db
      .select()
      .from(submissionsImages)
      .where(inArray(submissionsImages.submissionId, submissionIds));

    const imageIds = allImages.map((img) => img.id);

    const allClassifications =
      imageIds.length > 0
        ? await db
            .select()
            .from(classifications)
            .where(inArray(classifications.imageId, imageIds))
        : [];

    const imageCounts = await db
      .select({
        submissionId: submissionsImages.submissionId,
        count: count(submissionsImages.id).as("count"),
      })
      .from(submissionsImages)
      .where(inArray(submissionsImages.submissionId, submissionIds))
      .groupBy(submissionsImages.submissionId);

    // 3. Proses dan gabungkan data
    const classificationsMap = new Map(
      allClassifications.map((c) => [c.imageId, c]),
    );
    const imageCountMap = new Map(
      imageCounts.map((row) => [row.submissionId, row.count]),
    );

    const previewDataMap = new Map();
    // Cari gambar pertama untuk setiap submission sebagai preview
    for (const submission of userSubmissions) {
      const firstImage = allImages.find(
        (img) => img.submissionId === submission.id,
      );
      if (firstImage) {
        const classification = classificationsMap.get(firstImage.id);
        previewDataMap.set(submission.id, {
          imageUrl: firstImage.imageUrl,
          status: firstImage.status,
          classificationResult: classification?.classificationResult,
          confidence: classification?.confidence,
          wasteCount: classification?.wasteCount,
        });
      }
    }

    return NextResponse.json({
      allSubmissions: userSubmissions,
      previewDataArray: Array.from(previewDataMap.entries()),
      imageCountArray: Array.from(imageCountMap.entries()),
    });
  } catch (error) {
    console.error("!!! FATAL ERROR in /api/submissions-status:", error);
    return NextResponse.json(
      { message: "Gagal mengambil submissions.", error: error.message },
      { status: 500 },
    );
  }
}
