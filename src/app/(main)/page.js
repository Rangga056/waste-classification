"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useSession, signOut } from "next-auth/react"; // Impor dari "next-auth/react"

export default function HomePage() {
  const { data: session, status } = useSession();

  return (
    <main className=" min-h-screen flex flex-col bg-gradient-to-br from-green-50 via-blue-50 to-emerald-50 overflow-hidden">
      {/* Header dengan tombol login/logout */}
      <header className="px-4 py-4 flex justify-end items-center">
        {status === "loading" ? (
          <div className="h-9 w-20 bg-gray-200 rounded-md animate-pulse"></div>
        ) : session ? (
          <div className="flex items-center gap-2">
            <span className="text-gray-700 text-sm">
              Halo, {session.user.name || session.user.email}!
            </span>
            <Button onClick={() => signOut()} size="sm" variant="outline">
              Keluar
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Link href="/login">
              <Button size="sm">Masuk</Button>
            </Link>
            <Link href="/register">
              <Button size="sm" variant="secondary">
                Daftar
              </Button>
            </Link>
          </div>
        )}
      </header>

      {/* Content */}
      <section className="flex-1 flex items-center justify-center text-center px-4 py-20">
        <div className="max-w-3xl space-y-8">
          <div className="space-y-4">
            <h1 className="text-5xl md:text-6xl font-bold text-green-900 leading-tight">
              Klasifikasi Sampah
              <span className="text-emerald-600"> Otomatis</span>
            </h1>
            <p className="text-gray-700 text-xl md:text-2xl font-medium">
              Teknologi AI untuk Pengelolaan Sampah yang Lebih Cerdas
            </p>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              Unggah foto sampah Anda dan biarkan sistem kami
              mengklasifikasikannya secara otomatis dengan teknologi machine
              learning terdepan.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/upload">
              <Button
                size="lg"
                className="w-full sm:w-auto px-8 py-4 cursor-pointer text-lg font-semibold bg-green-600 hover:bg-green-700 shadow-lg hover:shadow-xl transition-all duration-300 h-12"
              >
                🚀 Mulai Unggah
              </Button>
            </Link>
            <Link href="/submissions">
              <Button
                size="lg"
                variant="outline"
                className="w-full sm:w-auto px-8 py-4 cursor-pointer text-lg font-semibold border-2 border-green-600 text-green-600 hover:bg-green-50 shadow-lg hover:shadow-xl transition-all duration-300 h-12"
              >
                📊 Lihat Semua Pengiriman
              </Button>
            </Link>
          </div>

          {/* Stats or features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16">
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-lg">
              <div className="text-3xl font-bold text-green-600 mb-2">99%</div>
              <div className="text-gray-700 font-medium">
                Akurasi Klasifikasi
              </div>
            </div>
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-lg">
              <div className="text-3xl font-bold text-blue-600 mb-2">10+</div>
              <div className="text-gray-700 font-medium">Jenis Sampah</div>
            </div>
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-lg">
              <div className="text-3xl font-bold text-emerald-600 mb-2">
                1000+
              </div>
              <div className="text-gray-700 font-medium">
                Sampah Terklasifikasikan
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="relative z-10 text-center text-sm text-gray-500 py-6 border-t bg-white/70 backdrop-blur-sm">
        © {new Date().getFullYear()} Klasifikasi Sampah. Semua hak dilindungi.
      </footer>
    </main>
  );
}
