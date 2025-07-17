// src/app/api/upload/route.js
import { db } from "@/db/db";
import {
  submissions,
  submissionsImages,
  classifications,
  users,
} from "@/db/schema"; // Impor tabel users
import { v4 as uuidv4 } from "uuid";
import fs from "fs";
import path from "path";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { GoogleGenerativeAI } from "@google/generative-ai";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";

// Inisialisasi Gemini API dengan kunci API Anda
const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY);
// GANTI MODEL INI: gemini-pro-vision -> gemini-1.5-flash
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// Fungsi pembantu untuk mengonversi Buffer ke Base64
function bufferToBase64(buffer, mimeType) {
  return `data:${mimeType};base64,${buffer.toString("base64")}`;
}

export async function POST(req) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return new Response(JSON.stringify({ message: "Tidak terautentikasi." }), {
      status: 401,
    });
  }

  const formData = await req.formData();
  const username = session.user.name || session.user.email;
  let userId = session.user.id; // Dapatkan userId dari sesi

  const images = formData.getAll("images");

  if (images.length === 0) {
    return new Response(
      JSON.stringify({ message: "Silakan pilih setidaknya satu file gambar." }),
      { status: 400 }
    );
  }

  let submissionId;

  try {
    // --- Validasi userId sebelum menyisipkan ke submissions ---
    // Pastikan userId dari sesi benar-benar ada di tabel users
    const existingUserInDb = await db.query.users.findFirst({
      where: (u, { eq }) => eq(u.id, userId),
    });

    if (!existingUserInDb) {
      console.error(
        `User ID ${userId} dari sesi tidak ditemukan di tabel users.`
      );
      return new Response(
        JSON.stringify({
          message:
            "User ID tidak valid. Silakan login ulang atau hubungi administrator.",
        }),
        { status: 400 }
      );
    }
    // --- Akhir validasi userId ---

    const [insertedSubmission] = await db.insert(submissions).values({
      userId: userId,
      username: username,
    });
    submissionId = insertedSubmission.insertId;

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

      const imageUrl = `/uploads/${filename}`;

      const [insertedImage] = await db.insert(submissionsImages).values({
        submissionId,
        imageUrl,
        status: "Pending",
      });
      const imageId = insertedImage.insertId;

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
              geminiError
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
        })()
      );
    }

    return new Response(
      JSON.stringify({
        message: "Unggahan diterima, klasifikasi dimulai!",
        submissionId,
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Error rute unggahan:", error);
    return new Response(
      JSON.stringify({ message: "Terjadi kesalahan server internal." }),
      { status: 500 }
    );
  }
}
