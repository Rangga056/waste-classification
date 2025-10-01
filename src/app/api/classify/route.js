// src/app/api/classify/route.js
import { db } from "@/db/db";
import { submissionsImages, classifications } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import mime from "mime-types";

// ===== MENGGUNAKAN KONFIGURASI YANG ANDA MINTA =====
const genAI = new GoogleGenerativeAI(
  process.env.GEMINI_API_KEY_WASTE_CLASSIFICATION
);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

export async function POST(req) {
  let imageId;

  try {
    const body = await req.json();
    imageId = body.imageId;
    const { imageUrl, submissionId } = body;

    if (!imageId || !imageUrl || !submissionId) {
      return NextResponse.json(
        { message: "Data tidak lengkap." },
        { status: 400 }
      );
    }

    await db
      .update(submissionsImages)
      .set({ status: "Processing" })
      .where(eq(submissionsImages.id, imageId));

    revalidatePath("/submissions");
    revalidatePath(`/submissions/${submissionId}`);

    const filename = decodeURIComponent(imageUrl.split("/").pop());
    const filepath = path.join(process.cwd(), "public", "uploads", filename);
    const imageBuffer = await fs.readFile(filepath);

    const image = {
      inlineData: {
        data: imageBuffer.toString("base64"),
        mimeType: mime.lookup(filepath) || "application/octet-stream",
      },
    };

    // ===== MENGGUNAKAN PROMPT YANG ANDA MINTA =====
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

    await db.insert(classifications).values({
      imageId,
      classificationResult: geminiResponse.classification || "Tidak Diketahui",
      confidence: geminiResponse.confidence || 0.0,
      wasteCount: geminiResponse.count ?? null,
    });

    await db
      .update(submissionsImages)
      .set({ status: "Completed" })
      .where(eq(submissionsImages.id, imageId));

    revalidatePath("/submissions");
    revalidatePath(`/submissions/${submissionId}`);

    return NextResponse.json(
      { message: "Klasifikasi berhasil." },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      `!!! FATAL ERROR in /api/classify for imageId ${imageId}:`,
      error
    );
    if (imageId) {
      try {
        await db
          .update(submissionsImages)
          .set({ status: "Failed" })
          .where(eq(submissionsImages.id, imageId));
        revalidatePath("/submissions");
      } catch (updateError) {
        console.error(
          `Failed to update status to Failed for imageId ${imageId}:`,
          updateError
        );
      }
    }

    return NextResponse.json(
      { message: "Klasifikasi gagal.", error: error.message },
      { status: 500 }
    );
  }
}
