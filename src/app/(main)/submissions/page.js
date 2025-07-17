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
            (img) => img.status === "Pending" || img.status === "Processing"
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
      <main className="max-w-3xl mx-auto p-6 space-y-4 text-center">
        <p className="text-muted-foreground">Memuat pengiriman...</p>
        <RefreshCw className="animate-spin mx-auto text-blue-500" size={24} />
      </main>
    );
  }

  const { allSubmissions, previewDataMap, imageCountMap } = submissionsData;

  return (
    <main className="max-w-3xl mx-auto p-6 space-y-4">
      <div className="flex justify-between items-center mb-4">
        <Link href="/" className="text-blue-600 hover:underline">
          ← Kembali ke Beranda
        </Link>
        {session ? (
          <div className="flex items-center gap-2">
            <span className="text-gray-700">
              Halo, {session.user.name || session.user.email}!
            </span>
            {session.user.role === "admin" && (
              <Link href="/admin/dashboard">
                <Button size="sm" variant="secondary">
                  Dashboard Admin
                </Button>
              </Link>
            )}
            <Button onClick={() => signOut()} size="sm" variant="outline">
              Keluar
            </Button>
          </div>
        ) : (
          <Link href="/login">
            <Button size="sm">Masuk</Button>
          </Link>
        )}
      </div>

      <h1 className="text-2xl font-bold my-4">Semua Pengiriman</h1>
      {allSubmissions.length === 0 ? (
        <p className="text-muted-foreground">Tidak ada pengiriman ditemukan.</p>
      ) : (
        allSubmissions.map((submission) => {
          const preview = previewDataMap.get(submission.id);
          const isProcessing =
            preview?.status === "Pending" || preview?.status === "Processing";
          const isFailed = preview?.status === "Failed";
          const isCompleted = preview?.status === "Completed";

          return (
            <Card key={submission.id}>
              <CardContent className="p-4 flex items-center gap-4">
                <ImagePreview
                  imageUrl={preview?.imageUrl}
                  username={submission.username}
                />

                <div className="flex-grow">
                  <p className="font-semibold">{submission.username}</p>
                  <p className="text-sm text-muted-foreground">
                    Diunggah pada:{" "}
                    {new Date(submission.uploadedAt).toLocaleString()}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {imageCountMap.get(submission.id) || 0} gambar
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
                        <span className="text-red-500">Klasifikasi Gagal</span>
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
                  <div className="flex flex-col gap-2 items-end">
                    {isProcessing ? (
                      <span className="text-gray-400 cursor-not-allowed">
                        Lihat Detail
                      </span>
                    ) : (
                      <Link
                        className="text-blue-600 hover:underline"
                        href={`/submissions/${submission.id}`}
                      >
                        Lihat Detail
                      </Link>
                    )}

                    {session?.user?.role === "admin" && ( // Hanya tampilkan tombol hapus untuk admin
                      <button
                        type="submit"
                        className="text-red-600 hover:underline"
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
    </main>
  );
}
