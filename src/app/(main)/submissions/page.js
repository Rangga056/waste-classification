import { db } from "@/db/db";
import { submissions, submissionsImages } from "@/db/schema";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { count } from "drizzle-orm";
import { deleteSubmission } from "@/lib/submissions.actions";

export default async function SubmissionsPage() {
  // Fetch all submissions + count of images
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
    imageCounts.map((row) => [row.submissionId, row.count]),
  );

  return (
    <main className="max-w-3xl mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-bold mb-4">All Submissions</h1>

      {allSubmissions.length === 0 ? (
        <p className="text-muted-foreground">No submissions found.</p>
      ) : (
        allSubmissions.map((submission) => (
          <Card key={submission.id}>
            <CardContent className="p-4 flex justify-between items-center">
              <div>
                <p className="font-semibold">{submission.username}</p>
                <p className="text-sm text-muted-foreground">
                  Uploaded at:{" "}
                  {new Date(submission.uploadedAt).toLocaleString()}
                </p>
                <p className="text-sm text-muted-foreground">
                  {imageCountMap.get(submission.id) || 0} images
                </p>
              </div>
              <form
                action={async () => {
                  "use server";
                  await deleteSubmission(submission.id);
                }}
              >
                <div className="flex gap-3">
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
