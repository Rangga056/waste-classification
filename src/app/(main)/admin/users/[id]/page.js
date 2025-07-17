// src/app/(main)/admin/users/[id]/page.js
import { authOptions } from "@/auth"; // Impor authOptions
import { getServerSession } from "next-auth"; // Impor getServerSession
import { redirect, notFound } from "next/navigation";
import { db } from "@/db/db";
import {
  users,
  submissions,
  submissionsImages,
  classifications,
} from "@/db/schema";
import { eq, desc, inArray } from "drizzle-orm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Image from "next/image";
import Link from "next/link";
import { RefreshCw, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default async function AdminUserDetailPage({ params }) {
  const session = await getServerSession(authOptions); // Dapatkan sesi di server

  // Proteksi: Hanya admin yang bisa mengakses
  if (!session || !session.user || session.user.role !== "admin") {
    redirect("/login");
  }

  const { id: userId } = params; // Ambil userId dari params

  // Ambil detail pengguna
  const [user] = await db.select().from(users).where(eq(users.id, userId));

  if (!user) {
    notFound();
  }

  // Ambil semua submissions oleh pengguna ini
  const userSubmissions = await db
    .select()
    .from(submissions)
    .where(eq(submissions.userId, userId))
    .orderBy(desc(submissions.uploadedAt));

  // Ambil gambar dan klasifikasi untuk semua submissions pengguna ini
  const submissionIds = userSubmissions.map((s) => s.id);
  let allImages = [];
  let allClassifications = [];

  if (submissionIds.length > 0) {
    allImages = await db
      .select()
      .from(submissionsImages)
      .where(inArray(submissionsImages.submissionId, submissionIds));

    const imageIds = allImages.map((img) => img.id);
    if (imageIds.length > 0) {
      allClassifications = await db
        .select()
        .from(classifications)
        .where(inArray(classifications.imageId, imageIds));
    }
  }

  const imageMap = new Map(allImages.map((img) => [img.id, img]));
  const classificationMap = new Map(
    allClassifications.map((c) => [c.imageId, c])
  );

  // Gabungkan gambar dan klasifikasi ke setiap submission
  const submissionsWithDetails = userSubmissions.map((s) => ({
    ...s,
    images: allImages
      .filter((img) => img.submissionId === s.id)
      .map((img) => ({
        ...img,
        classification: classificationMap.get(img.id),
      })),
  }));

  const totalSubmissionsCount = userSubmissions.length;

  return (
    <main className="flex min-h-screen flex-col gap-8 p-8 md:p-12">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">
          Pengiriman oleh {user.name || user.email}
        </h1>
        <div className="flex gap-2">
          <Link href="/admin/users">
            <Button variant="outline">← Kembali ke Daftar Pengguna</Button>
          </Link>
          <Link href="/admin/dashboard">
            <Button variant="secondary">Dashboard Admin</Button>
          </Link>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold">
            Ringkasan Pengguna
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p>
            <strong>Nama:</strong> {user.name}
          </p>
          <p>
            <strong>Email:</strong> {user.email}
          </p>
          <p>
            <strong>Peran:</strong> {user.role}
          </p>
          <p>
            <strong>Total Pengiriman:</strong> {totalSubmissionsCount}
          </p>
        </CardContent>
      </Card>

      {submissionsWithDetails.length === 0 ? (
        <p className="text-muted-foreground text-center">
          Pengguna ini belum memiliki pengiriman.
        </p>
      ) : (
        submissionsWithDetails.map((submission) => (
          <Card key={submission.id}>
            <CardHeader>
              <CardTitle className="text-xl">
                Pengiriman #{submission.id} -{" "}
                {new Date(submission.uploadedAt).toLocaleString()}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {submission.images.map((img) => {
                  const currentStatus = img.status || "Unknown";
                  const isProcessing =
                    currentStatus === "Pending" ||
                    currentStatus === "Processing";
                  const isFailed = currentStatus === "Failed";
                  const isCompleted = currentStatus === "Completed";
                  const result = img.classification;

                  return (
                    <Card key={img.id} className="overflow-hidden">
                      <CardContent className="p-0">
                        <Image
                          src={img.imageUrl}
                          alt={`Gambar yang diunggah ${img.id}`}
                          width={400}
                          height={300}
                          className="w-full h-48 object-cover"
                        />
                        <div className="p-3 space-y-1">
                          <div className="flex items-center gap-2 text-sm font-semibold">
                            {isProcessing && (
                              <>
                                <RefreshCw
                                  className="animate-spin text-blue-500"
                                  size={16}
                                />
                                <span className="text-blue-500">
                                  Status: Memproses...
                                </span>
                              </>
                            )}
                            {isCompleted && (
                              <>
                                <CheckCircle
                                  className="text-green-500"
                                  size={16}
                                />
                                <span className="text-green-500">
                                  Status: Selesai
                                </span>
                              </>
                            )}
                            {isFailed && (
                              <>
                                <XCircle className="text-red-500" size={16} />
                                <span className="text-red-500">
                                  Status: Gagal
                                </span>
                              </>
                            )}
                            {!isProcessing && !isCompleted && !isFailed && (
                              <span className="text-muted-foreground">
                                Status: Tidak Diketahui
                              </span>
                            )}
                          </div>

                          {isCompleted && result?.classificationResult && (
                            <>
                              <p className="text-sm font-semibold">
                                Klasifikasi:{" "}
                                <span className="text-blue-600">
                                  {result.classificationResult}
                                </span>
                              </p>
                              <p className="text-sm text-muted-foreground">
                                Kepercayaan:{" "}
                                {result.confidence?.toFixed(2) ?? "–"}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                Jumlah Sampah: {result.wasteCount ?? "–"}
                              </p>
                            </>
                          )}
                          {!isCompleted && (
                            <p className="text-sm text-muted-foreground">
                              Hasil akan muncul di sini setelah klasifikasi
                              selesai.
                            </p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </main>
  );
}
