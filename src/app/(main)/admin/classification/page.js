// src/app/(main)/admin/classification/page.js
import { authOptions } from "@/auth";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { db } from "@/db/db";
import { classifications, submissionsImages, submissions } from "@/db/schema";
import { eq } from "drizzle-orm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Package } from "lucide-react";
import Link from "next/link";
import { CategoryClassificationTable } from "./components/CategoryClassificationTable";

export default async function AdminClassificationPage() {
  const session = await getServerSession(authOptions);

  // Protection: Only admin can access
  if (!session || !session.user || session.user.role !== "admin") {
    redirect("/login");
  }

  // Expected waste categories from Gemini API
  const WASTE_CATEGORIES = [
    "Organik",
    "Plastik Daur Ulang",
    "Kertas Daur Ulang",
    "Kaca Daur Ulang",
    "Logam Daur Ulang",
    "Sampah Lainnya",
    "Tidak Ada Sampah",
    "Tidak Diketahui",
    "Gagal Klasifikasi",
  ];

  // Get all completed classifications
  const allClassifications = await db
    .select({
      id: classifications.id,
      imageId: classifications.imageId,
      classificationResult: classifications.classificationResult,
      confidence: classifications.confidence,
      wasteCount: classifications.wasteCount,
      createdAt: classifications.createdAt,
      imageUrl: submissionsImages.imageUrl,
      submissionId: submissionsImages.submissionId,
      username: submissions.username,
    })
    .from(classifications)
    .leftJoin(
      submissionsImages,
      eq(classifications.imageId, submissionsImages.id),
    )
    .leftJoin(submissions, eq(submissionsImages.submissionId, submissions.id))
    .where(eq(submissionsImages.status, "Completed"));

  // Group submissions by category
  const submissionsByCategory = {};
  WASTE_CATEGORIES.forEach((cat) => {
    submissionsByCategory[cat] = [];
  });

  allClassifications.forEach((cls) => {
    const category = cls.classificationResult || "Tidak Diketahui";
    if (submissionsByCategory.hasOwnProperty(category)) {
      submissionsByCategory[category].push(cls);
    } else {
      submissionsByCategory["Sampah Lainnya"].push(cls);
    }
  });
  // Count per category
  const categoryCounts = {};
  WASTE_CATEGORIES.forEach((cat) => {
    categoryCounts[cat] = 0;
  });

  allClassifications.forEach((cls) => {
    const category = cls.classificationResult || "Tidak Diketahui";
    if (categoryCounts.hasOwnProperty(category)) {
      categoryCounts[category]++;
    } else {
      categoryCounts["Sampah Lainnya"] =
        (categoryCounts["Sampah Lainnya"] || 0) + 1;
    }
  });

  return (
    <main className="flex min-h-screen flex-col gap-8 p-8 md:p-12">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Klasifikasi Sampah per Kategori</h1>
        <Link href="/admin/dashboard">
          <Button variant="outline">← Kembali ke Dashboard</Button>
        </Link>
      </div>

      {/* Category Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Object.entries(categoryCounts).map(([category, count]) => (
          <Card key={category}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{category}</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{count}</div>
              <p className="text-xs text-muted-foreground">
                Total item terklasifikasi
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Category Tables */}
      {Object.entries(submissionsByCategory).map(
        ([category, submissionsList]) => (
          <CategoryClassificationTable
            key={category}
            category={category}
            data={submissionsList}
          />
        ),
      )}
    </main>
  );
}
