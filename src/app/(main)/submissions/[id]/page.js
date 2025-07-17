// src/app/(main)/submissions/[id]/page.js
import { db } from "@/db/db";
import { submissions, submissionsImages, classifications } from "@/db/schema";
import { eq, inArray } from "drizzle-orm";
import { Card, CardContent } from "@/components/ui/card";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { RefreshCw, CheckCircle, XCircle } from "lucide-react";

// Tidak ada perubahan signifikan di sini karena ini adalah Server Component
// dan tidak langsung menggunakan useSession.
// Data sudah diambil di server.

export default async function SubmissionDetailPage({ params }) {
  const { id } = await params;
  const submissionId = parseInt(id);

  const [submission] = await db
    .select()
    .from(submissions)
    .where(eq(submissions.id, submissionId));

  if (!submission) return notFound();

  const images = await db
    .select()
    .from(submissionsImages)
    .where(eq(submissionsImages.submissionId, submissionId));

  const imageIds = images.map((img) => img.id);

  const classificationResults = imageIds.length
    ? await db
        .select()
        .from(classifications)
        .where(inArray(classifications.imageId, imageIds))
    : [];

  const classificationMap = new Map(
    classificationResults.map((c) => [c.imageId, c])
  );

  return (
    <main className="max-w-4xl mx-auto p-6 space-y-6">
      <Link href="/submissions" className="text-blue-600 hover:underline">
        ← Kembali ke Pengiriman
      </Link>

      <h1 className="text-2xl font-bold">Detail Pengiriman</h1>
      <p className="text-muted-foreground">
        <strong>Nama Pengguna:</strong> {submission.username}
      </p>
      <p className="text-muted-foreground">
        <strong>Diunggah pada:</strong>{" "}
        {new Date(submission.uploadedAt).toLocaleString()}
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-6">
        {images.map((img) => {
          const result = classificationMap.get(img.id);
          const currentStatus = img.status || "Unknown";
          const isProcessing =
            currentStatus === "Pending" || currentStatus === "Processing";
          const isFailed = currentStatus === "Failed";
          const isCompleted = currentStatus === "Completed";

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
                        <CheckCircle className="text-green-500" size={16} />
                        <span className="text-green-500">Status: Selesai</span>
                      </>
                    )}
                    {isFailed && (
                      <>
                        <XCircle className="text-red-500" size={16} />
                        <span className="text-red-500">Status: Gagal</span>
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
                        Kepercayaan: {result.confidence?.toFixed(2) ?? "–"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Jumlah Sampah: {result.wasteCount ?? "–"}
                      </p>
                    </>
                  )}
                  {!isCompleted && (
                    <p className="text-sm text-muted-foreground">
                      Hasil akan muncul di sini setelah klasifikasi selesai.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </main>
  );
}
