import { db } from "@/db/db";
import { submissions, submissionsImages, classifications } from "@/db/schema";
import { eq, inArray } from "drizzle-orm";
import { Card, CardContent } from "@/components/ui/card";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function SubmissionDetailPage({ params }) {
  const { id } = params;
  const submissionId = parseInt(id);

  // 1. Get submission
  const [submission] = await db
    .select()
    .from(submissions)
    .where(eq(submissions.id, submissionId));

  if (!submission) return notFound();

  // 2. Get images
  const images = await db
    .select()
    .from(submissionsImages)
    .where(eq(submissionsImages.submissionId, submissionId));

  const imageIds = images.map((img) => img.id);

  // 3. Classifications
  const classificationResults = imageIds.length
    ? await db
        .select()
        .from(classifications)
        .where(inArray(classifications.imageId, imageIds))
    : [];

  const classificationMap = new Map(
    classificationResults.map((c) => [c.imageId, c]),
  );

  return (
    <main className="max-w-4xl mx-auto p-6 space-y-6">
      <Link href="/submissions" className="text-blue-600 hover:underline">
        ← Back to submissions
      </Link>

      <h1 className="text-2xl font-bold">Submission Detail</h1>
      <p className="text-muted-foreground">
        <strong>Username:</strong> {submission.username}
      </p>
      <p className="text-muted-foreground">
        <strong>Uploaded at:</strong>{" "}
        {new Date(submission.uploadedAt).toLocaleString()}
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-6">
        {images.map((img) => {
          const result = classificationMap.get(img.id);
          return (
            <Card key={img.id} className="overflow-hidden">
              <CardContent className="p-0">
                <Image
                  src={img.imageUrl}
                  alt={`Uploaded image ${img.id}`}
                  width={400}
                  height={300}
                  className="w-full h-48 object-cover"
                />
                <div className="p-3 space-y-1">
                  <p className="text-sm font-semibold">
                    Classification:{" "}
                    <span className="text-blue-600">
                      {result?.classificationResult || "Pending"}
                    </span>
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Confidence: {result?.confidence?.toFixed(2) ?? "–"}
                  </p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </main>
  );
}
