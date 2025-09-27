// src/app/(main)/upload/page.js
import UploadForm from "./form";
import { auth } from "@/auth";
import Link from "next/link";

export default async function UploadPage() {
  const session = await auth(); // Dapatkan sesi di server

  if (!session || !session.user) {
    return (
      <main className="py-10 text-center">
        <h1 className="text-2xl font-bold text-red-500">Akses Ditolak</h1>
        <p className="text-muted-foreground">
          Anda harus masuk untuk mengunggah sampah.
        </p>
        <p className="text-muted-foreground">
          Silakan{" "}
          <Link href="/login" className="text-blue-600 hover:underline">
            Masuk
          </Link>
          .
        </p>
      </main>
    );
  }

  return (
    <main className="py-10">
      <UploadForm />
    </main>
  );
}
