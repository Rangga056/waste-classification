// src/app/(main)/admin/classification/page.js
import { auth } from "@/auth";
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
  const session = await auth();

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
    <main className="flex min-h-screen flex-col gap-8 p-8 md:p-12 container mx-auto">
      <Link href="/admin/dashboard" className="flex w-full justify-end">
        <Button variant="outline" className="text-sm md:text-lg cursor-pointer">
          ← Kembali ke Dashboard
        </Button>
      </Link>
      <div className="flex justify-between items-center">
        <h1 className="text-xl md:text-3xl font-bold">
          Klasifikasi Sampah per Kategori
        </h1>
      </div>

      {/* Category Summary Cards */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-3">
        {Object.entries(categoryCounts).map(([category, count]) => (
          <Card key={category} className="gap-0 flex-col justify-between">
            <CardHeader className="flex flex-col md:flex-row items-center justify-center space-y-0 pb-2 text-center">
              <CardTitle className="text-base md:text-xl font-medium">
                {category}
              </CardTitle>
              <Package className="h-4 md:h-8 w-4 md:w-8 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl text-center font-bold">{count}</div>
              <p className="text-sm mt-2 text-muted-foreground text-center">
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
