import { db } from "@/db/db";
import { submissions, submissionsImages } from "@/db/schema";
import { v4 as uuidv4 } from "uuid";
import fs from "fs";
import path from "path";

export async function POST(req) {
  const formData = await req.formData();
  console.log(formData);
  const username = formData.get("username");
  const images = formData.getAll("images");

  if (!username || images.length === 0) {
    return new Response("Invalid data", { status: 400 });
  }

  // Insert into submissions
  const [inserted] = await db.insert(submissions).values({
    username,
  });

  const submissionId = inserted.insertId;

  // Save images to disk (example only)
  for (const file of images) {
    const bytes = Buffer.from(await file.arrayBuffer());
    const filename = `${uuidv4()}-${file.name}`;
    const filepath = path.join(process.cwd(), "public", "uploads", filename);

    fs.writeFileSync(filepath, bytes);

    await db.insert(submissionsImages).values({
      submissionId,
      imageUrl: `/uploads/${filename}`,
    });
  }

  return new Response("OK", { status: 200 });
}
