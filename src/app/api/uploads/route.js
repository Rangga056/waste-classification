// src/app/api/uploads/route.js
import { db } from "@/db/db";
import { submissions, submissionsImages, users } from "@/db/schema";
import { v4 as uuidv4 } from "uuid";
import fs from "fs";
import path from "path";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json(
        { message: "Tidak terautentikasi." },
        { status: 401 }
      );
    }

    const formData = await req.formData();
    const { name: username, id: userId } = session.user;
    const images = formData.getAll("images");

    if (images.length === 0) {
      return NextResponse.json(
        { message: "Silakan pilih setidaknya satu file gambar." },
        { status: 400 }
      );
    }

    const [existingUserInDb] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    if (!existingUserInDb) {
      return NextResponse.json(
        { message: "User ID tidak valid." },
        { status: 400 }
      );
    }

    const [insertedSubmission] = await db
      .insert(submissions)
      .values({ userId, username })
      .returning();
    const submissionId = insertedSubmission.id;

    for (const file of images) {
      const bytes = Buffer.from(await file.arrayBuffer());
      const safeFileName = file.name.replace(/\s+/g, "-");
      const filename = `${uuidv4()}-${safeFileName}`;

      const uploadDir = path.join(process.cwd(), "public", "uploads");
      if (!fs.existsSync(uploadDir))
        fs.mkdirSync(uploadDir, { recursive: true });

      const filepath = path.join(uploadDir, filename);
      fs.writeFileSync(filepath, bytes);

      const imageUrl = `/api/uploads/${filename}`;

      const [insertedImage] = await db
        .insert(submissionsImages)
        .values({ submissionId, imageUrl, status: "Pending" })
        .returning();
      const imageId = insertedImage.id;

      // Panggil API klasifikasi baru di latar belakang (tanpa 'await')
      fetch(`${process.env.AUTH_URL}/api/classify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageId, imageUrl, submissionId }),
      });
    }

    revalidatePath("/submissions");

    return NextResponse.json(
      {
        message: "Unggahan diterima! Klasifikasi dimulai di latar belakang.",
        submissionId,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("!!! FATAL ERROR in /api/uploads route:", error);
    return NextResponse.json(
      {
        message: "Terjadi kesalahan server internal saat mengunggah.",
        error: error.message,
      },
      { status: 500 }
    );
  }
}
