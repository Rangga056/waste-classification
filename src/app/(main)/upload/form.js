"use client";

import { useDropzone } from "react-dropzone";
import { useCallback, useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { CloudUpload, X } from "lucide-react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { toast } from "sonner";
import { useSession } from "next-auth/react"; // Impor useSession

export default function UploadForm() {
  const router = useRouter();
  const { data: session } = useSession(); // Dapatkan sesi pengguna

  const [files, setFiles] = useState([]);
  // Inisialisasi username dari sesi jika tersedia
  const [username, setUsername] = useState(
    session?.user?.name || session?.user?.email || ""
  );
  const [loading, setLoading] = useState(false);

  // Perbarui username jika sesi berubah (misal: setelah login/logout)
  useEffect(() => {
    if (session?.user) {
      setUsername(session.user.name || session.user.email);
    } else {
      setUsername(""); // Kosongkan jika tidak ada sesi
    }
  }, [session]);

  const onDrop = useCallback((acceptedFiles) => {
    const filesWithPreview = acceptedFiles.map((file) =>
      Object.assign(file, {
        preview: URL.createObjectURL(file),
      })
    );
    setFiles((prev) => [...prev, ...filesWithPreview]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [],
    },
    multiple: true,
  });

  const removeFile = (fileName) => {
    setFiles(files.filter((file) => file.name !== fileName));
  };

  useEffect(() => {
    return () => files.forEach((file) => URL.revokeObjectURL(file.preview));
  }, [files]);

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    toast.info("Mengunggah gambar...", { duration: 2000 });

    if (files.length === 0) {
      toast.error("Silakan pilih setidaknya satu file gambar.", {
        duration: 3000,
      });
      setLoading(false);
      return;
    }

    const formData = new FormData();
    // Username tidak lagi dikirim dari input form karena sudah diambil dari sesi di API route
    files.forEach((file) => formData.append("images", file));

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        toast.success("Unggahan berhasil! Klasifikasi dimulai...", {
          duration: 2000,
        });
        setFiles([]);
        // Username tidak perlu direset karena akan diisi ulang dari sesi
        router.push("/submissions");
      } else {
        const errorData = await res.json();
        toast.error(
          `Unggahan gagal: ${errorData.message || "Kesalahan tidak diketahui"}`,
          { duration: 5000 }
        );
        console.error("Upload failed:", errorData);
      }
    } catch (error) {
      toast.error("Terjadi kesalahan saat mengunggah.", { duration: 5000 });
      console.error("An error occurred during upload:", error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white p-8 rounded-2xl shadow-xl max-w-4xl mx-auto">
      <Link href="/" className="text-blue-600 hover:underline">
        ← Kembali ke Beranda
      </Link>
      <h1 className="text-3xl font-bold text-center mb-2 text-gray-800">
        Unggah Gambar Anda
      </h1>
      <p className="text-center text-gray-500 mb-8">
        Seret dan lepas atau klik untuk memilih file untuk klasifikasi.
      </p>
      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 md:grid-cols-2 gap-8"
      >
        <div className="space-y-6">
          <div>
            <Label className="block text-lg font-medium text-gray-700 mb-2">
              Username
            </Label>
            <Input
              value={username} // Nilai ini akan otomatis terisi
              onChange={(e) => setUsername(e.target.value)} // Tetap ada untuk kepatuhan React, tapi tidak akan banyak berubah
              className="px-4 py-2 h-12 text-base border-gray-300 rounded-lg w-full focus:ring-blue-500 focus:border-blue-500"
              placeholder="Nama pengguna Anda"
              disabled // Nonaktifkan karena nilai diambil dari sesi
            />
          </div>
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer h-64 flex flex-col items-center justify-center transition-colors duration-200 ${
              isDragActive
                ? "border-blue-500 bg-blue-50"
                : "border-gray-300 hover:border-blue-400 hover:bg-gray-50"
            }`}
          >
            <input {...getInputProps()} />
            <CloudUpload className="text-blue-500 h-16 w-16 mb-4" />
            {isDragActive ? (
              <p className="text-blue-600 font-semibold">
                Jatuhkan file di sini...
              </p>
            ) : (
              <p className="text-gray-600">
                Seret & lepas gambar di sini, atau{" "}
                <span className="font-semibold text-blue-600">
                  klik untuk memilih
                </span>
              </p>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-lg font-medium text-gray-700">
            Pratinjau Gambar ({files.length})
          </h2>
          {files.length > 0 ? (
            <ul className="h-80 overflow-y-auto space-y-3 p-3 bg-gray-50 rounded-lg border">
              {files.map((file) => (
                <li
                  key={file.name}
                  className="flex items-center justify-between bg-white p-2 rounded-md shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <Image
                      src={file.preview}
                      alt={file.name}
                      width={64}
                      height={64}
                      className="rounded-md object-cover"
                      onLoad={() => {
                        URL.revokeObjectURL(file.preview);
                      }}
                    />
                    <div className="text-sm">
                      <p className="font-medium text-gray-800 truncate w-48">
                        {file.name}
                      </p>
                      <p className="text-gray-500">
                        {(file.size / 1024).toFixed(2)} KB
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(file.name)}
                  >
                    <X className="h-4 w-4 text-red-500" />
                  </Button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="h-80 flex items-center justify-center bg-gray-50 rounded-lg border">
              <p className="text-gray-400">Tidak ada file yang dipilih</p>
            </div>
          )}
        </div>

        <div className="md:col-span-2 w-full flex flex-col justify-center items-center gap-4 mt-4">
          <Button
            type="submit"
            className={
              "w-full md:w-1/2 h-12 text-lg font-semibold cursor-pointer"
            }
            disabled={files.length === 0 || loading}
          >
            {loading ? "Mengunggah..." : "Unggah"}
          </Button>
        </div>
      </form>
    </div>
  );
}
