// src/app/(main)/upload/page.js
import UploadForm from "./form";
import { auth } from "@/auth";
import Link from "next/link";
import { ShieldAlert } from "lucide-react";

export default async function UploadPage() {
  const session = await auth();

  if (!session || !session.user) {
    return (
      <main className="container mx-auto flex flex-col justify-center items-center min-h-[60vh] py-10 px-4 text-center">
        <ShieldAlert className="w-16 h-16 text-rose-500 mb-4" />
        <h1 className="text-2xl md:text-3xl font-bold text-slate-800 mb-2">Akses Ditolak</h1>
        <p className="text-slate-500 max-w-md mx-auto">
          Anda harus masuk ke akun Anda terlebih dahulu untuk menggunakan fitur deteksi sampah ini.
        </p>
        <Link 
          href="/login" 
          className="mt-6 inline-flex h-10 items-center justify-center rounded-md bg-blue-600 px-8 text-sm font-medium text-white shadow transition-colors hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-700 disabled:pointer-events-none"
        >
          Masuk Sekarang
        </Link>
      </main>
    );
  }

  return (
    <main className="container mx-auto p-4 md:p-8 flex flex-col justify-center w-full max-w-5xl">
      <UploadForm />
    </main>
  );
}
