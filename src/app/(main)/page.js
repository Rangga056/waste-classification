// src/app/(main)/page.js
"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useSession, signOut } from "next-auth/react";
import { ShieldUser } from "lucide-react";

export default function HomePage() {
  const { data: session, status } = useSession();

  return (
    <main className="min-h-full flex flex-col relative w-full items-center justify-center">
      {/* Header dengan tombol login/logout */}
      <header className="px-4 py-4 w-full flex justify-end items-center absolute top-0 right-0 z-50">
        {status === "loading" ? (
          <div className="h-9 w-20 bg-slate-200 rounded-md animate-pulse"></div>
        ) : session ? (
          <div className="flex items-center gap-2">
            <span className="text-slate-700 text-sm hidden sm:inline">
              Halo, {session.user.name || session.user.email}!
            </span>
            <Button
              onClick={() => signOut()}
              size="lg"
              variant="destructive"
              className="hover:shadow-md transition-shadow"
            >
              Keluar
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Link href="/login">
              <Button size="lg">
                Masuk
              </Button>
            </Link>
            <Link href="/register">
              <Button size="lg" variant="secondary">
                Daftar
              </Button>
            </Link>
          </div>
        )}
      </header>

      {/* Content */}
      <section className="flex-1 flex items-center justify-center text-center px-4 py-10 sm:py-20 mt-12 w-full">
        <div className="max-w-3xl space-y-6 sm:space-y-8 w-full">
          <div className="space-y-3 sm:space-y-4">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-slate-800 leading-tight">
              Klasifikasi Sampah
              <span className="text-blue-600 block mt-2"> Otomatis</span>
            </h1>
            <p className="text-lg sm:text-xl md:text-2xl font-medium text-slate-600">
              Teknologi AI untuk Pengelolaan Sampah yang Lebih Cerdas
            </p>
            <p className="text-base sm:text-lg max-w-2xl mx-auto text-slate-500 px-2 leading-relaxed">
              Unggah foto sampah Anda dan biarkan sistem kami
              mengklasifikasikannya secara otomatis dengan teknologi machine
              learning terdepan.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-2 pt-4">
            <Link href="/upload">
              <Button
                size="lg"
                className="w-full sm:w-auto px-6 py-3 sm:px-8 sm:py-4 text-base sm:text-lg font-semibold bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-xl transition-all duration-300 h-10 sm:h-12"
              >
                🚀 Mulai Unggah
              </Button>
            </Link>
            <Link href="/submissions">
              <Button
                size="lg"
                variant="outline"
                className="w-full sm:w-auto px-6 py-3 sm:px-8 sm:py-4 text-base sm:text-lg font-semibold border-2 border-blue-600 text-blue-600 bg-white hover:bg-blue-50 shadow-lg hover:shadow-xl transition-all duration-300 h-10 sm:h-12"
              >
                📊 Lihat Semua Pengiriman
              </Button>
            </Link>
            {session?.user?.role === "admin" && (
              <Link href="/admin/dashboard">
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full sm:w-auto px-6 py-3 sm:px-8 sm:py-4 text-base sm:text-lg font-semibold border-2 border-slate-800 text-slate-800 bg-white hover:bg-slate-100 shadow-lg hover:shadow-xl transition-all duration-300 h-10 sm:h-12"
                >
                  Dashboard Admin <ShieldUser size={20} className="ml-2" />
                </Button>
              </Link>
            )}
          </div>

          {/* Stats or features */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-8 sm:mt-16 px-2 w-full">
            <div className="bg-white/70 backdrop-blur-md border border-slate-100/50 rounded-2xl p-5 sm:p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="text-2xl sm:text-3xl font-black text-blue-600 mb-1 sm:mb-2">
                99%
              </div>
              <div className="text-slate-600 text-sm sm:text-base font-semibold uppercase tracking-wider">
                Akurasi Klasifikasi
              </div>
            </div>
            <div className="bg-white/70 backdrop-blur-md border border-slate-100/50 rounded-2xl p-5 sm:p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="text-2xl sm:text-3xl font-black text-emerald-500 mb-1 sm:mb-2">
                10+
              </div>
              <div className="text-slate-600 text-sm sm:text-base font-semibold uppercase tracking-wider">
                Jenis Sampah
              </div>
            </div>
            <div className="bg-white/70 backdrop-blur-md border border-slate-100/50 rounded-2xl p-5 sm:p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="text-2xl sm:text-3xl font-black text-indigo-500 mb-1 sm:mb-2">
                1000+
              </div>
              <div className="text-slate-600 text-sm sm:text-base font-semibold uppercase tracking-wider">
                Data Terverifikasi
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="w-full relative z-10 text-center text-xs sm:text-sm text-slate-400 py-6 mt-auto">
        © {new Date().getFullYear()} Klasifikasi Sampah. Semua hak dilindungi.
      </footer>
    </main>
  );
}
