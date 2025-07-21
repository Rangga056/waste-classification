"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useSession, signOut } from "next-auth/react"; // Impor dari "next-auth/react"
import { ShieldUser } from "lucide-react";

export default function HomePage() {
  const { data: session, status } = useSession();

  return (
    <main className="min-h-screen flex flex-col bg-gradient-to-br from-green-50 via-blue-50 to-emerald-50 overflow-hidden">
      {/* Header dengan tombol login/logout */}
      <header className="px-4 py-4 flex justify-end items-center">
        {status === "loading" ? (
          <div className="h-9 w-20 bg-gray-200 rounded-md animate-pulse"></div>
        ) : session ? (
          <div className="flex items-center gap-2">
            <span className="text-gray-700 text-sm hidden sm:inline">
              Halo, {session.user.name || session.user.email}!
            </span>
            <Button
              onClick={() => signOut()}
              size="lg"
              variant="destructive"
              className="cursor-pointer hover:shadow-md transition-shadow"
            >
              Keluar
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Link href="/login">
              <Button size="lg" className="cursor-pointer">
                Masuk
              </Button>
            </Link>
            <Link href="/register">
              <Button size="lg" className="cursor-pointer" variant="secondary">
                Daftar
              </Button>
            </Link>
          </div>
        )}
      </header>

      {/* Content */}
      <section className="flex-1 flex items-center justify-center text-center px-4 py-10 sm:py-20">
        <div className="max-w-3xl space-y-6 sm:space-y-8">
          <div className="space-y-3 sm:space-y-4">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-green-900 leading-tight">
              Klasifikasi Sampah
              <span className="text-emerald-600"> Otomatis</span>
            </h1>
            <p className="text-lg sm:text-xl md:text-2xl font-medium text-gray-700">
              Teknologi AI untuk Pengelolaan Sampah yang Lebih Cerdas
            </p>
            <p className="text-base sm:text-lg max-w-2xl mx-auto text-gray-600 px-2">
              Unggah foto sampah Anda dan biarkan sistem kami
              mengklasifikasikannya secara otomatis dengan teknologi machine
              learning terdepan.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-2">
            <Link href="/upload">
              <Button
                size="lg"
                className="w-full sm:w-auto px-6 py-3 sm:px-8 sm:py-4 cursor-pointer text-base sm:text-lg font-semibold bg-green-600 hover:bg-green-700 shadow-lg hover:shadow-xl transition-all duration-300 h-10 sm:h-12"
              >
                🚀 Mulai Unggah
              </Button>
            </Link>
            <Link href="/submissions">
              <Button
                size="lg"
                variant="outline"
                className="w-full sm:w-auto px-6 py-3 sm:px-8 sm:py-4 cursor-pointer text-base sm:text-lg font-semibold border-2 border-green-600 text-green-600 hover:bg-green-50 shadow-lg hover:shadow-xl transition-all duration-300 h-10 sm:h-12"
              >
                📊 Lihat Semua Pengiriman
              </Button>
            </Link>
            {session?.user?.role === "admin" && ( // Added optional chaining to prevent error
              <Link href="/admin/dashboard">
                <Button
                  size="lg"
                  variant="outline"
                  className="sm:w-auto px-6 py-3 sm:px-8 sm:py-4 cursor-pointer text-base sm:text-lg font-semibold border-2 border-green-600 text-green-600 hover:bg-green-50 shadow-lg hover:shadow-xl transition-all duration-300 h-10 sm:h-12"
                >
                  Dashboard Admin <ShieldUser size={50} />
                </Button>
              </Link>
            )}{" "}
          </div>

          {/* Stats or features */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-8 sm:mt-16 px-2">
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-5 sm:p-6 shadow-lg">
              <div className="text-2xl sm:text-3xl font-bold text-green-600 mb-1 sm:mb-2">
                99%
              </div>
              <div className="text-gray-700 text-sm sm:text-base font-medium">
                Akurasi Klasifikasi
              </div>
            </div>
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-5 sm:p-6 shadow-lg">
              <div className="text-2xl sm:text-3xl font-bold text-blue-600 mb-1 sm:mb-2">
                10+
              </div>
              <div className="text-gray-700 text-sm sm:text-base font-medium">
                Jenis Sampah
              </div>
            </div>
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-5 sm:p-6 shadow-lg">
              <div className="text-2xl sm:text-3xl font-bold text-emerald-600 mb-1 sm:mb-2">
                1000+
              </div>
              <div className="text-gray-700 text-sm sm:text-base font-medium">
                Sampah Terklasifikasikan
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="relative z-10 text-center text-xs sm:text-sm text-gray-500 py-4 sm:py-6 border-t bg-white/70 backdrop-blur-sm">
        © {new Date().getFullYear()} Klasifikasi Sampah. Semua hak dilindungi.
      </footer>
    </main>
  );
}
