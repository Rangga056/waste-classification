// src/app/(main)/submissions/page.js
"use client";

import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { deleteSubmission } from "@/lib/submissions.actions";
import React, { useState, useEffect } from "react";
import ImagePreview from "./components/ImagePreview";
import { RefreshCw, CheckCircle, XCircle } from "lucide-react";

import { useSession, signOut } from "next-auth/react"; // Menggunakan next-auth/react
import { Button } from "@/components/ui/button";

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
  const { data: session, status } = useSession();
  const [submissionsData, setSubmissionsData] = useState(null);
  const [loading, setLoading] = useState(true);

  const refreshData = async () => {
    setLoading(true);
    const data = await fetchSubmissionsData();
    setSubmissionsData(data);
    setLoading(false);
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
      if (status === "authenticated") {
        const hasPending =
          submissionsData?.previewDataMap &&
          Array.from(submissionsData.previewDataMap.values()).some(
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
      <main className="container mx-auto p-6 space-y-4 text-center">
        <p className="text-muted-foreground">Memuat pengiriman...</p>
        <RefreshCw className="animate-spin mx-auto text-blue-500" size={24} />
      </main>
    );
  }

  const { allSubmissions, previewDataMap, imageCountMap } = submissionsData;

  return (
    <main className="container mx-auto p-6 space-y-4">
      <div className="flex justify-between items-center mb-4">
        <Link href="/" className="text-blue-600 hover:underline">
          ← Kembali ke Beranda
        </Link>
        {session ? (
          <div className="flex items-center gap-2">
            <span className="text-gray-700 hidden md:block">
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
          <Link href="/login">
            <Button size="sm">Masuk</Button>
          </Link>
        )}
      </div>
      <div className="flex items-center justify-between w-full">
        <h1 className="text-xl md:text-2xl font-bold my-4">Semua Pengiriman</h1>
        {session.user.role === "admin" && (
          <Link href="/admin/dashboard">
            <Button
              size="sm"
              variant="secondary"
              className={
                "cursor-pointer hover:shadow-md transition-shadow border h-14 md:h-12"
              }
            >
              Dashboard <br className="block md:hidden" />
              Admin
            </Button>
          </Link>
        )}
      </div>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-4">
        {allSubmissions.length === 0 ? (
          <p className="text-muted-foreground">
            Tidak ada pengiriman ditemukan.
          </p>
        ) : (
          allSubmissions.map((submission) => {
            const preview = previewDataMap.get(submission.id);
            const isProcessing =
              preview?.status === "Pending" || preview?.status === "Processing";
            const isFailed = preview?.status === "Failed";
            const isCompleted = preview?.status === "Completed";

            return (
              <Card key={submission.id} className={"py-0"}>
                <CardContent className="p-4 flex items-center gap-4 flex-col">
                  <ImagePreview
                    imageUrl={preview?.imageUrl}
                    username={submission.username}
                  />

                  <div className="w-full flex flex-col gap-y-[0.5em]">
                    <p className="font-semibold capitalize">
                      {submission.username}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Diunggah pada:{" "}
                      {new Date(submission.uploadedAt).toLocaleString()}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {imageCountMap.get(submission.id) || 0} Gambar
                    </p>

                    <div className="flex items-center gap-2 text-sm">
                      {isProcessing && (
                        <>
                          <RefreshCw
                            className="animate-spin text-blue-500"
                            size={16}
                          />
                          <span className="text-blue-500">Memproses...</span>
                        </>
                      )}
                      {isCompleted && (
                        <>
                          <CheckCircle className="text-green-500" size={16} />
                          <span className="text-green-500">
                            Klasifikasi Selesai
                          </span>
                        </>
                      )}
                      {isFailed && (
                        <>
                          <XCircle className="text-red-500" size={16} />
                          <span className="text-red-500">
                            Klasifikasi Gagal
                          </span>
                        </>
                      )}
                      {!isProcessing && !isCompleted && !isFailed && (
                        <span className="text-muted-foreground">
                          Status Tidak Diketahui
                        </span>
                      )}
                    </div>

                    {isCompleted && preview?.classificationResult && (
                      <>
                        <p className="text-sm">
                          Klasifikasi:{" "}
                          <span className="text-blue-600">
                            {preview.classificationResult}
                          </span>{" "}
                          (Kepercayaan: {preview.confidence?.toFixed(2) ?? "–"})
                        </p>
                        <p className="text-sm">
                          Jumlah Sampah: {preview.wasteCount ?? "–"}
                        </p>
                      </>
                    )}
                  </div>
                  <form action={deleteSubmission.bind(null, submission.id)}>
                    <div className="flex flex-row gap-2 items-center justify-center gap-x-4">
                      {isProcessing ? (
                        <Button
                          className="text-gray-400 cursor-not-allowed py-2 px-6 w-32"
                          size="lg"
                        >
                          Lihat Detail
                        </Button>
                      ) : (
                        <Link
                          className="text-blue-600 hover:underline cursor-pointer"
                          href={`/submissions/${submission.id}`}
                        >
                          <Button
                            size="lg"
                            className="py-2 px-6 w-32 cursor-pointer"
                          >
                            Lihat Detail
                          </Button>
                        </Link>
                      )}

                      {session?.user?.role === "admin" && ( // Hanya tampilkan tombol hapus untuk admin
                        <button
                          type="submit"
                          className="text-red-600 border border-red-500 py-2 px-6 rounded-md cursor-pointer w-32"
                          variant="destructive"
                          size="lg"
                        >
                          Hapus
                        </button>
                      )}
                    </div>
                  </form>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </main>
  );
}
