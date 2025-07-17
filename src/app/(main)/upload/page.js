// src/app/(main)/upload/page.js
import { authOptions } from "@/auth";
import UploadForm from "./form";
import { getServerSession } from "next-auth"; // Impor getServerSession
import Link from "next/link";

export default async function UploadPage() {
  const session = await getServerSession(authOptions); // Dapatkan sesi di server

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
