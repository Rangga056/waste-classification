// src/app/api/uploads/route.js// src/app/api/uploads/route.js
import { db } from "@/db/db";
import {
  submissions,
  submissionsImages,
  classifications,
  users,
} from "@/db/schema";
import { v4 as uuidv4 } from "uuid";
import fs from "fs";
import path from "path";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { auth } from "@/auth"; // <-- Pastikan ini sudah diperbarui
import { NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(
  process.env.GEMINI_API_KEY_WASTE_CLASSIFICATION,
);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

function bufferToBase64(buffer, mimeType) {
  return `data:${mimeType};base64,${buffer.toString("base64")}`;
}

export async function POST(req) {
  console.log("--- API /api/uploads POST request received ---");
  try {
    const session = await auth();
    console.log("Session object:", session);

    if (!session || !session.user) {
      console.error("Upload attempt without authentication.");
      return NextResponse.json(
        { message: "Tidak terautentikasi." },
        { status: 401 },
      );
    }

    const formData = await req.formData();
    const username = session.user.name || session.user.email;
    let userId = session.user.id;
    console.log(`Processing upload for user: ${username} (ID: ${userId})`);

    const images = formData.getAll("images");

    if (images.length === 0) {
      return NextResponse.json(
        { message: "Silakan pilih setidaknya satu file gambar." },
        { status: 400 },
      );
    }

    console.log(`${images.length} images found in form data.`);

    // --- Validasi userId sebelum menyisipkan ke submissions ---
    const [existingUserInDb] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!existingUserInDb) {
      console.error(
        `User ID ${userId} dari sesi tidak ditemukan di tabel users.`,
      );
      return NextResponse.json(
        { message: "User ID tidak valid. Silakan login ulang." },
        { status: 400 },
      );
    }

    console.log("User validated. Inserting into submissions table...");
    const [insertedSubmission] = await db
      .insert(submissions)
      .values({
        userId: userId,
        username: username,
      })
      .returning();
    const submissionId = insertedSubmission.id;
    console.log(`Submission created with ID: ${submissionId}`);

    const classificationPromises = [];

    for (const file of images) {
      const bytes = Buffer.from(await file.arrayBuffer());
      const filename = `${uuidv4()}-${file.name}`;
      const uploadDir = path.join(process.cwd(), "public", "uploads");

      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      const filepath = path.join(uploadDir, filename);
      fs.writeFileSync(filepath, bytes);

      const imageUrl = `/api/uploads/${filename}`;

      const [insertedImage] = await db
        .insert(submissionsImages)
        .values({
          submissionId,
          imageUrl,
          status: "Pending",
        })
        .returning();
      const imageId = insertedImage.id;

      classificationPromises.push(
        (async () => {
          let classificationResult = "Error";
          let confidence = 0.0;
          let wasteCount = null;
          let newStatus = "Failed";

          try {
            await db
              .update(submissionsImages)
              .set({ status: "Processing" })
              .where(eq(submissionsImages.id, imageId));
            revalidatePath("/submissions");
            revalidatePath(`/submissions/${submissionId}`);
            revalidatePath("/admin/dashboard");
            revalidatePath("/admin/users");
            revalidatePath("/admin/classification");

            const image = {
              inlineData: {
                data: Buffer.from(bytes).toString("base64"),
                mimeType: file.type,
              },
            };

            const prompt = `Klasifikasikan jenis sampah dalam gambar dan hitung berapa banyak item sampah yang terlihat. Berikan respons dalam format JSON berikut:
            {
              "classification": "jenis_sampah",
              "count": jumlah_item,
              "confidence": tingkat_kepercayaan_0_1
            }
            Jenis sampah yang mungkin: 'Organik', 'Plastik Daur Ulang', 'Kertas Daur Ulang', 'Kaca Daur Ulang', 'Logam Daur Ulang', atau 'Sampah Lainnya'.
            Jika tidak ada sampah yang terdeteksi, setel "classification" menjadi "Tidak Ada Sampah", "count" menjadi 0, dan "confidence" menjadi 0.`;

            const result = await model.generateContent({
              contents: [{ role: "user", parts: [{ text: prompt }, image] }],
              generationConfig: {
                responseMimeType: "application/json",
                responseSchema: {
                  type: "OBJECT",
                  properties: {
                    classification: { type: "STRING" },
                    count: { type: "NUMBER" },
                    confidence: { type: "NUMBER" },
                  },
                  required: ["classification", "count", "confidence"],
                },
              },
            });

            const geminiResponse = JSON.parse(result.response.text());

            classificationResult =
              geminiResponse.classification || "Tidak Diketahui";
            wasteCount = geminiResponse.count ?? null;
            confidence = geminiResponse.confidence || 0.0;
            newStatus = "Completed";
          } catch (geminiError) {
            console.error(
              `Error dari Gemini API untuk gambar ${file.name}:`,
              geminiError,
            );
            classificationResult = "Gagal Klasifikasi";
            confidence = 0.0;
            wasteCount = null;
            newStatus = "Failed";
          } finally {
            await db
              .update(submissionsImages)
              .set({ status: newStatus })
              .where(eq(submissionsImages.id, imageId));

            if (newStatus === "Completed") {
              await db.insert(classifications).values({
                imageId,
                classificationResult,
                confidence,
                wasteCount,
                createdAt: new Date(),
              });
            }
            revalidatePath("/submissions");
            revalidatePath(`/submissions/${submissionId}`);
            revalidatePath("/admin/dashboard");
            revalidatePath("/admin/users");
            revalidatePath("/admin/classification");
          }
        })(),
      );
    }

    return NextResponse.json(
      {
        message: "Unggahan diterima, klasifikasi dimulai!",
        submissionId,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("!!! FATAL ERROR in /api/uploads route:", error);
    return NextResponse.json(
      { message: "Terjadi kesalahan server internal.", error: error.message },
      { status: 500 },
    );
  }
}
