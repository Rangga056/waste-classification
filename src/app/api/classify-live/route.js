// src/app/api/classify-live/route.js
import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(
  process.env.GEMINI_API_KEY_WASTE_CLASSIFICATION
);
const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });

export async function POST(req) {
  try {
    const body = await req.json();
    const { base64Image, mimeType } = body;

    if (!base64Image) {
      return NextResponse.json(
        { message: "Gambar tidak ditemukan." },
        { status: 400 }
      );
    }

    const imageParts = {
      inlineData: {
        data: base64Image.split(",")[1] || base64Image, // Remove data:image/jpeg;base64, prefix if present
        mimeType: mimeType || "image/jpeg",
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
      contents: [{ role: "user", parts: [{ text: prompt }, imageParts] }],
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

    return NextResponse.json(
      { 
        message: "Klasifikasi berhasil.",
        classification: geminiResponse.classification || "Tidak Diketahui",
        confidence: geminiResponse.confidence || 0.0,
        count: geminiResponse.count ?? 0
       },
      { status: 200 }
    );
  } catch (error) {
    console.error(`!!! FATAL ERROR in /api/classify-live:`, error);
    
    return NextResponse.json(
      { message: "Klasifikasi gagal.", error: error.message },
      { status: 500 }
    );
  }
}
