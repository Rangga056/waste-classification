// src/app/api/submissions-status/route.js - Alternative approach
import { db } from "@/db/db";
import {
  submissions,
  submissionsImages,
  classifications,
  users,
} from "@/db/schema";
import { desc, eq, sql, count } from "drizzle-orm";
import { NextResponse } from "next/server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return new Response(JSON.stringify({ message: "Tidak terautentikasi." }), {
      status: 401,
    });
  }

  const userRole = session.user.role;
  const currentUserId = session.user.id;

  try {
    let allSubmissionsQuery;

    if (userRole === "admin") {
      allSubmissionsQuery = db
        .select({
          id: submissions.id,
          userId: submissions.userId,
          username: users.name, // Get username from users table
          uploadedAt: submissions.uploadedAt,
          userEmail: users.email,
          userRole: users.role,
        })
        .from(submissions)
        .leftJoin(users, eq(submissions.userId, users.id))
        .orderBy(desc(submissions.uploadedAt));
    } else {
      allSubmissionsQuery = db
        .select({
          id: submissions.id,
          userId: submissions.userId,
          username: users.name, // Get username from users table
          uploadedAt: submissions.uploadedAt,
        })
        .from(submissions)
        .leftJoin(users, eq(submissions.userId, users.id))
        .where(eq(submissions.userId, currentUserId))
        .orderBy(desc(submissions.uploadedAt));
    }

    const allSubmissions = (await allSubmissionsQuery) || [];

    // Rest of the code remains the same...
    const imageCountsResult =
      (await db
        .select({
          submissionId: submissionsImages.submissionId,
          count: count(submissionsImages.id).as("count"),
        })
        .from(submissionsImages)
        .groupBy(submissionsImages.submissionId)) || [];

    const previewImagesResult =
      (await db
        .select({
          submissionId: submissionsImages.submissionId,
          imageUrl: submissionsImages.imageUrl,
          status: submissionsImages.status,
          classificationResult: classifications.classificationResult,
          confidence: classifications.confidence,
          wasteCount: classifications.wasteCount,
        })
        .from(submissionsImages)
        .leftJoin(
          classifications,
          eq(submissionsImages.id, classifications.imageId),
        )) || [];

    const previewDataMap = new Map();

    previewImagesResult.forEach((data) => {
      if (data && typeof data === "object" && data.submissionId !== undefined) {
        if (!previewDataMap.has(data.submissionId)) {
          previewDataMap.set(data.submissionId, {
            imageUrl: data.imageUrl ?? null,
            status: data.status ?? "Unknown",
            classificationResult: data.classificationResult ?? null,
            confidence: data.confidence ?? null,
            wasteCount: data.wasteCount ?? null,
          });
        }
      } else {
        console.warn(
          "Skipping invalid or incomplete previewImagesResult data row:",
          data,
        );
      }
    });

    const serializedAllSubmissions = allSubmissions
      .map((submission) => {
        if (!submission || typeof submission !== "object") {
          console.warn("Skipping invalid submission row:", submission);
          return null;
        }
        return {
          id: submission.id,
          userId: submission.userId,
          username: submission.username ?? "Unknown User",
          uploadedAt: submission.uploadedAt,
          userEmail: submission.userEmail ?? "N/A",
          userRole: submission.userRole ?? "N/A",
        };
      })
      .filter((item) => item !== null);

    const imageCountArray = imageCountsResult
      .map((row) => {
        if (
          row &&
          typeof row === "object" &&
          row.submissionId !== undefined &&
          row.count !== undefined
        ) {
          return [row.submissionId, row.count];
        }
        console.warn(
          "Skipping invalid or incomplete imageCountsResult row:",
          row,
        );
        return null;
      })
      .filter((item) => item !== null);

    const previewDataArray = previewDataMap
      ? Array.from(previewDataMap.entries())
      : [];

    return NextResponse.json({
      allSubmissions: serializedAllSubmissions,
      previewDataArray: previewDataArray,
      imageCountArray: imageCountArray,
    });
  } catch (error) {
    console.error("Error fetching submissions status:", error);
    return NextResponse.json(
      { message: "Gagal mengambil submissions." },
      { status: 500 },
    );
  }
}
