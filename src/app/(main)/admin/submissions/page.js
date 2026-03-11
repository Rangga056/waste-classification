// src/app/(main)/admin/submissions/page.js
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/db/db";
import { submissions, submissionsImages, classifications, users } from "@/db/schema";
import { desc, inArray } from "drizzle-orm";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AdminSubmissionsTable } from "./components/AdminSubmissionsTable";
import { PackageSearch, ArrowLeft } from "lucide-react";

export default async function AdminSubmissionsPage() {
  const session = await auth();

  if (!session || !session.user || session.user.role !== "admin") {
    redirect("/login");
  }

  // Fetch all submissions
  const allSubmissionsList = await db
    .select({
      id: submissions.id,
      userId: submissions.userId,
      username: submissions.username,
      uploadedAt: submissions.uploadedAt,
    })
    .from(submissions)
    .orderBy(desc(submissions.uploadedAt));

  if (allSubmissionsList.length === 0) {
    return (
      <main className="container mx-auto p-6 md:p-8 min-h-screen">
        <div className="flex flex-col items-center justify-center pt-20">
          <PackageSearch className="w-16 h-16 text-slate-300 mb-4" />
          <h1 className="text-2xl font-bold text-slate-700">Manajemen Pengiriman</h1>
          <p className="text-slate-500">Belum ada data pengiriman sampah di database.</p>
          <Link href="/admin/dashboard" className="mt-6">
            <Button variant="outline">Kembali ke Dashboard</Button>
          </Link>
        </div>
      </main>
    );
  }

  const submissionIds = allSubmissionsList.map(s => s.id);
  const userIds = [...new Set(allSubmissionsList.map(s => s.userId))];

  // Fetch Users
  const fetchedUsers = await db.select().from(users).where(inArray(users.id, userIds));
  const usersMap = new Map();
  fetchedUsers.forEach(u => usersMap.set(u.id, u));

  // Fetch Images
  const allImages = await db
    .select()
    .from(submissionsImages)
    .where(inArray(submissionsImages.submissionId, submissionIds));

  const imageIds = allImages.map(img => img.id);

  // Fetch Classifications
  const allClassifications = imageIds.length > 0 
    ? await db.select().from(classifications).where(inArray(classifications.imageId, imageIds))
    : [];

  const classificationsMap = new Map(allClassifications.map(c => [c.imageId, c]));

  // Assemble the enriched data array
  const enrichedData = allSubmissionsList.map(submission => {
    // We display the status based on the first image for summary purposes
    const firstImage = allImages.find(img => img.submissionId === submission.id);
    const classification = firstImage ? classificationsMap.get(firstImage.id) : null;
    
    let classificationResult = "";
    if (firstImage) {
      if (firstImage.status === "Pending" || firstImage.status === "Processing") {
        classificationResult = "";
      } else if (firstImage.status === "Failed") {
         classificationResult = "Gagal";
      } else if (classification) {
        classificationResult = classification.classificationResult;
      }
    }

    return {
      ...submission,
      user: usersMap.get(submission.userId) || null,
      classificationResult,
    };
  });

  return (
    <main className="flex min-h-screen flex-col gap-6 p-4 md:p-8 bg-slate-50/50">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <div>
          <Link href="/admin/dashboard" className="inline-flex text-blue-600 hover:text-blue-800 font-medium text-sm items-center gap-1 mb-2 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Kembali Dashboard
          </Link>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-800">
            Daftar Seluruh Pengiriman
          </h1>
          <p className="text-sm text-slate-500 mt-1">Cari, filter, dan urutkan hasil deteksi sampah dari semua pengguna.</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
         <AdminSubmissionsTable data={enrichedData} />
      </div>
    </main>
  );
}
