// src/app/api/uploads/[...filename]/route.js
import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import mime from "mime-types";

export async function GET(req, { params }) {
  // 1. Construct the path
  const filename = params.filename.join("/");
  const filepath = path.join(process.cwd(), "public", "uploads", filename);

  // --- DEBUGGING LOGS ---
  // These logs will appear in your server's terminal, not the browser console.
  console.log("--- New Image Request ---");
  console.log("Requested filename:", filename);
  console.log("Full path being checked:", filepath);
  // --- END DEBUGGING LOGS ---

  try {
    // 2. Check if the file exists using fs.statSync
    fs.statSync(filepath);
    console.log("File found at path:", filepath);

    // 3. Read the file and create a response
    const fileBuffer = fs.readFileSync(filepath);
    const mimeType = mime.lookup(filepath) || "application/octet-stream";

    return new NextResponse(fileBuffer, {
      headers: { "Content-Type": mimeType },
      status: 200,
    });
  } catch (error) {
    // This block will run if fs.statSync fails (meaning the file is not found)
    console.error("Error: File not found at path:", filepath);
    return new NextResponse(JSON.stringify({ message: "Image not found." }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }
}
