import { db } from "@/db/db";
import { submissions, submissionsImages } from "@/db/schema";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { desc, eq, sql } from "drizzle-orm";
import { count } from "drizzle-orm";
import { deleteSubmission } from "@/lib/submissions.actions";
import React from "react"; // Import React for Client Components
import ImagePreview from "./components/ImagePreview";

export default async function SubmissionsPage() {
  // Fetch all submissions
  const allSubmissions = await db
    .select({
      id: submissions.id,
      username: submissions.username,
      uploadedAt: submissions.uploadedAt,
    })
    .from(submissions)
    .orderBy(desc(submissions.uploadedAt));

  // Fetch image counts grouped by submissionId
  const imageCounts = await db
    .select({
      submissionId: submissionsImages.submissionId,
      count: count(submissionsImages.id).as("count"),
    })
    .from(submissionsImages)
    .groupBy(submissionsImages.submissionId);

  const imageCountMap = new Map(
    imageCounts.map((row) => [row.submissionId, row.count])
  );

  // Fetch one image URL per submission for preview
  const previewImages = await db
    .select({
      submissionId: submissionsImages.submissionId,
      imageUrl: submissionsImages.imageUrl,
    })
    .from(submissionsImages);

  const previewImageMap = new Map();
  previewImages.forEach((image) => {
    if (!previewImageMap.has(image.submissionId)) {
      previewImageMap.set(image.submissionId, image.imageUrl);
    }
  });

  return (
    <main className="max-w-3xl mx-auto p-6 space-y-4">
      <Link href="/" className="text-blue-600 hover:underline">
        ← Back to Home Page
      </Link>
      <h1 className="text-2xl font-bold my-4">All Submissions</h1>
      {allSubmissions.length === 0 ? (
        <p className="text-muted-foreground">No submissions found.</p>
      ) : (
        allSubmissions.map((submission) => (
          <Card key={submission.id}>
            <CardContent className="p-4 flex items-center gap-4">
              {/* Use the new Client Component for Image Preview */}
              <ImagePreview
                imageUrl={previewImageMap.get(submission.id)}
                username={submission.username}
              />

              <div className="flex-grow">
                <p className="font-semibold">{submission.username}</p>
                <p className="text-sm text-muted-foreground">
                  Uploaded at:{" "}
                  {new Date(submission.uploadedAt).toLocaleString()}
                </p>
                <p className="text-sm text-muted-foreground">
                  {imageCountMap.get(submission.id) || 0} images
                </p>
              </div>
              <form action={deleteSubmission.bind(null, submission.id)}>
                <div className="flex flex-col gap-2 items-end">
                  <Link
                    className="text-blue-600 hover:underline"
                    href={`/submissions/${submission.id}`}
                  >
                    View Details
                  </Link>

                  <button
                    type="submit"
                    className="text-red-600 hover:underline"
                  >
                    Delete
                  </button>
                </div>
              </form>
            </CardContent>
          </Card>
        ))
      )}
    </main>
  );
}
