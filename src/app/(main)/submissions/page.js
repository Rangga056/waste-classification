// src/app/(main)/submissions/page.js
"use client";

import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { deleteSubmission } from "@/lib/submissions.actions";
import React, { useState, useEffect } from "react";
import ImagePreview from "./components/ImagePreview";
import { RefreshCw, CheckCircle, XCircle, Trash2, ArrowRight, Plus } from "lucide-react";
import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

async function fetchSubmissionsData() {
  const res = await fetch("/api/submissions-status", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  if (!res.ok) {
    console.error("Failed to fetch submissions status:", await res.text());
    return {
      allSubmissions: [],
      previewDataMap: new Map(),
      imageCountMap: new Map(),
    };
  }

  const data = await res.json();
  return {
    allSubmissions: data.allSubmissions,
    previewDataMap: new Map(data.previewDataArray),
    imageCountMap: new Map(data.imageCountArray),
  };
}

export default function SubmissionsPageWrapper() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [submissionsData, setSubmissionsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(null); 

  const refreshData = async () => {
    const data = await fetchSubmissionsData();
    setSubmissionsData(data);
    setLoading(false);
  };

  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/" });
  };

  const handleDelete = async (submissionId) => {
    setIsDeleting(submissionId); 
    const result = await deleteSubmission(submissionId);
    if (result.success) {
      toast.success("Pengiriman berhasil dihapus!");
      await refreshData(); 
    } else {
      toast.error(
        `Gagal menghapus: ${result.error || "Kesalahan tidak diketahui"}`,
      );
    }
    setIsDeleting(null); 
  };

  useEffect(() => {
    if (status === "authenticated") {
      refreshData();
    } else if (status === "unauthenticated") {
      setLoading(false);
      setSubmissionsData({
        allSubmissions: [],
        previewDataMap: new Map(),
        imageCountMap: new Map(),
      });
    }
  }, [status]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (status === "authenticated" && submissionsData) {
        const hasPending = Array.from(
          submissionsData.previewDataMap.values(),
        ).some(
          (img) => img.status === "Pending" || img.status === "Processing",
        );
        if (hasPending) {
          refreshData();
        }
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [submissionsData, status]);

  if (status === "loading" || loading || !submissionsData) {
    return (
      <main className="container mx-auto p-6 md:p-10 space-y-8 bg-slate-50/30 min-h-screen">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
           <div className="space-y-3">
             <Skeleton className="h-4 w-32" />
             <Skeleton className="h-8 w-48 md:w-64" />
             <Skeleton className="h-4 w-60 md:w-80 mt-1" />
           </div>
           <div className="flex gap-3 mt-4 md:mt-0">
             <Skeleton className="h-10 w-24 hidden md:block" />
             <Skeleton className="h-10 w-24 hidden md:block" />
             <Skeleton className="h-10 w-20" />
           </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
           {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
             <div key={i} className="rounded-2xl border border-slate-200/60 bg-white shadow-sm overflow-hidden">
                <Skeleton className="aspect-[4/3] w-full rounded-none" />
                <div className="p-5 flex flex-col justify-between" style={{ minHeight: '180px' }}>
                   <div className="space-y-4">
                      <div className="flex justify-between">
                         <Skeleton className="h-6 w-24 rounded-lg" />
                         <Skeleton className="h-5 w-16" />
                      </div>
                      <div className="space-y-2">
                         <Skeleton className="h-5 w-32" />
                         <Skeleton className="h-3 w-40" />
                      </div>
                   </div>
                   <div className="flex gap-2 mt-4 pt-4 border-t border-slate-100">
                      <Skeleton className="h-9 flex-1" />
                      <Skeleton className="h-9 w-10" />
                   </div>
                </div>
             </div>
           ))}
        </div>
      </main>
    );
  }

  const { allSubmissions, previewDataMap, imageCountMap } = submissionsData;

  const getBadgeStyle = (classification) => {
    if (!classification) return "bg-gray-100 text-gray-700 bg-gray-50/50 backdrop-blur-md";
    const lower = classification.toLowerCase();
    if (lower.includes("organik")) return "bg-emerald-100 text-emerald-800 border-emerald-200";
    if (lower.includes("plastik")) return "bg-blue-100 text-blue-800 border-blue-200";
    if (lower.includes("kertas")) return "bg-amber-100 text-amber-800 border-amber-200";
    if (lower.includes("kaca")) return "bg-cyan-100 text-cyan-800 border-cyan-200";
    if (lower.includes("logam")) return "bg-indigo-100 text-indigo-800 border-indigo-200";
    if (lower.includes("tidak ada sampah")) return "bg-slate-100 text-slate-800 border-slate-200";
    return "bg-rose-100 text-rose-800 border-rose-200"; // Sampah lainnya or unknown
  };

  return (
    <main className="container mx-auto p-6 md:p-10 space-y-8 bg-slate-50/30 min-h-screen">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <Link href="/" className="inline-block text-blue-600 hover:text-blue-800 font-medium mb-2 transition-colors">
            ← Kembali ke Beranda
          </Link>
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Riwayat Deteksi</h1>
          <p className="text-slate-500 mt-1">Lacak dan lihat semua hasil deteksi sampah Anda di sini.</p>
        </div>
        
        <div className="flex items-center gap-3">
          {session ? (
            <>
              <div className="hidden md:flex flex-col items-end mr-2">
                <span className="text-sm text-slate-500">Masuk sebagai</span>
                <span className="font-semibold text-slate-800">
                  {session.user.name || session.user.email}
                </span>
              </div>
              {session.user.role === "admin" && (
                <Link href="/admin/dashboard">
                  <Button variant="outline" className="h-10 border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100 hidden sm:flex">
                    Admin Dashboard
                  </Button>
                </Link>
              )}
              <Link href="/upload">
                <Button className="h-10 bg-emerald-600 hover:bg-emerald-700 shadow-sm text-sm font-semibold">
                  <Plus className="w-4 h-4 mr-1"/> Tambah Unggahan
                </Button>
              </Link>
              <Button onClick={handleSignOut} variant="destructive" className="h-10 hover:shadow-md transition-all hidden sm:flex">
                Keluar
              </Button>
            </>
          ) : (
            <Link href="/login">
              <Button>Masuk</Button>
            </Link>
          )}
        </div>
      </div>

      {/* SUBMISSIONS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {allSubmissions.length === 0 ? (
          <div className="col-span-full py-20 flex flex-col items-center justify-center bg-white rounded-2xl border border-dashed border-slate-300">
            <Trash2 className="h-12 w-12 text-slate-300 mb-4" />
            <p className="text-lg font-medium text-slate-600">Belum ada riwayat deteksi</p>
            <Link href="/upload" className="mt-4 text-blue-600 hover:underline">Mulai klasifikasi sekarang</Link>
          </div>
        ) : (
          allSubmissions.map((submission) => {
            const preview = previewDataMap.get(submission.id);
            const isProcessing = preview?.status === "Pending" || preview?.status === "Processing";
            const isFailed = preview?.status === "Failed";
            const isCompleted = preview?.status === "Completed";
            const badgeClasses = getBadgeStyle(preview?.classificationResult);

            return (
              <Card key={submission.id} className="group overflow-hidden rounded-2xl border-slate-200/60 bg-white shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                <div className="relative aspect-[4/3] w-full bg-slate-100 overflow-hidden">
                   <ImagePreview imageUrl={preview?.imageUrl} username={submission.username} />
                   
                   {/* Overlay Status Badge */}
                   <div className="absolute top-3 left-3 flex gap-2">
                     {isProcessing && (
                       <div className="flex items-center gap-1.5 bg-white/90 backdrop-blur shadow-sm px-3 py-1.5 rounded-full text-xs font-bold text-blue-600">
                         <RefreshCw className="animate-spin" size={12} /> Sedang Proses
                       </div>
                     )}
                     {isFailed && (
                       <div className="flex items-center gap-1.5 bg-white/90 backdrop-blur shadow-sm px-3 py-1.5 rounded-full text-xs font-bold text-red-600">
                         <XCircle size={12} /> Gagal
                       </div>
                     )}
                   </div>
                </div>

                <CardContent className="p-5 flex flex-col justify-between" style={{ minHeight: '180px' }}>
                  <div className="space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        {isCompleted && preview?.classificationResult ? (
                          <span className={`inline-block px-3 py-1 border rounded-lg text-xs font-bold tracking-wide uppercase ${badgeClasses}`}>
                            {preview.classificationResult}
                          </span>
                        ) : (
                          <span className="inline-block px-3 py-1 bg-slate-100 border border-slate-200 rounded-lg text-xs font-medium text-slate-500">
                            Menyiapkan Data
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest bg-slate-50 px-2 py-1 rounded">
                        {imageCountMap.get(submission.id) || 1} Gambar
                      </p>
                    </div>

                    <div>
                      <p className="font-semibold text-slate-800 line-clamp-1">{submission.username}</p>
                      <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                        {new Date(submission.uploadedAt).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                      </p>
                      
                      {isCompleted && preview?.classificationResult && (
                        <div className="mt-2.5 flex items-center gap-3">
                           <div className="bg-slate-50 px-2.5 py-1.5 rounded-md border border-slate-100 text-xs font-medium">
                              Akurasi: <span className="text-slate-800">{(preview.confidence ? preview.confidence * 100 : 0).toFixed(0)}%</span>
                           </div>
                           <div className="bg-slate-50 px-2.5 py-1.5 rounded-md border border-slate-100 text-xs font-medium">
                              Jml: <span className="text-slate-800">{preview.wasteCount ?? "N/A"}</span>
                           </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2 mt-4 pt-4 border-t border-slate-100">
                    <Link href={`/submissions/${submission.id}`} className="flex-1">
                      <Button variant="ghost" className="w-full justify-between hover:bg-blue-50 hover:text-blue-700 transition-colors" disabled={isProcessing}>
                        Detail <ArrowRight size={14} />
                      </Button>
                    </Link>

                    {session?.user?.role === "admin" && (
                      <form action={() => handleDelete(submission.id)}>
                        <Button 
                          type="submit" 
                          variant="ghost" 
                          className="px-3 hover:bg-red-50 hover:text-red-600 transition-colors"
                          disabled={isDeleting === submission.id}
                        >
                          {isDeleting === submission.id ? <RefreshCw className="animate-spin w-4 h-4"/> : <Trash2 className="w-4 h-4" />}
                        </Button>
                      </form>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </main>
  );
}
