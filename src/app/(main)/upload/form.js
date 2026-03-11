"use client";

import { useDropzone } from "react-dropzone";
import { useCallback, useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { CloudUpload, X, Camera, Image as ImageIcon, CheckCircle, Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { toast } from "sonner";
import { useSession } from "next-auth/react";

export default function UploadForm() {
  const router = useRouter();
  const { data: session } = useSession();

  const [mode, setMode] = useState("upload"); // 'upload' | 'camera'
  
  // Upload State
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Camera State
  const videoRef = useRef(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [liveInfo, setLiveInfo] = useState(null); // { classification, confidence, count }
  const [isInferencing, setIsInferencing] = useState(false);

  const [username, setUsername] = useState(
    session?.user?.name || session?.user?.email || ""
  );

  useEffect(() => {
    if (session?.user) {
      setUsername(session.user.name || session.user.email);
    } else {
      setUsername("");
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

  // Handle standard multi-image upload
  async function handleSubmit(event) {
    if (event) event.preventDefault();
    setLoading(true);
    toast.info("Mengunggah gambar...", { duration: 2000 });

    if (files.length === 0) {
      toast.error("Silakan pilih setidaknya satu file gambar.", { duration: 3000 });
      setLoading(false);
      return;
    }

    const formData = new FormData();
    files.forEach((file) => formData.append("images", file));

    try {
      const res = await fetch("/api/uploads", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        toast.success("Unggahan berhasil! Klasifikasi dimulai...", { duration: 2000 });
        setFiles([]);
        router.push("/submissions");
      } else {
        const errorData = await res.json();
        toast.error(`Unggahan gagal: ${errorData.message || "Kesalahan tidak diketahui"}`, { duration: 5000 });
      }
    } catch (error) {
      toast.error("Terjadi kesalahan saat mengunggah.", { duration: 5000 });
    } finally {
      setLoading(false);
    }
  }

  // --- CAMERA & LIVE INFERENCE ---

  const startCamera = async () => {
    setMode("camera");
    setCapturedImage(null);
    setLiveInfo(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: "environment" } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setCameraActive(true);
    } catch (err) {
      console.error(err);
      toast.error("Tidak dapat mengakses kamera. Pastikan izin diberikan.");
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(track => track.stop());
    }
    setCameraActive(false);
  };

  const capturePhoto = async () => {
    if (!videoRef.current) return;
    
    setIsInferencing(true);
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    
    // Stop camera feed
    stopCamera();

    const base64Data = canvas.toDataURL("image/jpeg");
    setCapturedImage(base64Data);

    // Call Live Inference API
    try {
      const res = await fetch("/api/classify-live", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ base64Image: base64Data, mimeType: "image/jpeg" })
      });
      const data = await res.json();
      if (res.ok) {
        setLiveInfo({
          classification: data.classification,
          confidence: data.confidence,
          count: data.count
        });
        toast.success("Klasifikasi Live Selesai!");
      } else {
        toast.error("Gagal melakukan klasifikasi live.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Terjadi kesalahan saat klasifikasi live.");
    } finally {
      setIsInferencing(false);
    }
  };

  const retakePhoto = () => {
    setCapturedImage(null);
    setLiveInfo(null);
    startCamera();
  };

  const saveLivePhoto = async () => {
    if (!capturedImage) return;
    setLoading(true);
    
    // Convert base64 to File to use existing /api/uploads
    try {
      const resBlob = await fetch(capturedImage);
      const blob = await resBlob.blob();
      const file = new File([blob], `camera-${Date.now()}.jpg`, { type: "image/jpeg" });
      
      const formData = new FormData();
      formData.append("images", file);

      const res = await fetch("/api/uploads", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        toast.success("Foto berhasil disimpan ke riwayat Anda!");
        router.push("/submissions");
      } else {
        toast.error("Gagal menyimpan foto.");
      }
    } catch (err) {
      toast.error("Terjadi kesalahan saat menyimpan foto.");
    } finally {
      setLoading(false);
    }
  };

  // Clean up camera on unmount
  useEffect(() => {
    return () => stopCamera();
  }, []);

  return (
    <div className="bg-white/80 backdrop-blur-xl p-8 rounded-3xl shadow-2xl max-w-4xl mx-auto border border-gray-100">
      <div className="flex justify-between items-center mb-6">
        <Link href="/" className="text-blue-600 hover:text-blue-800 transition-colors font-medium flex items-center gap-2">
          ← Kembali
        </Link>
        <div className="flex bg-gray-100 p-1 rounded-xl">
          <button 
            onClick={() => { setMode("upload"); stopCamera(); }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${mode === "upload" ? "bg-white shadow-sm text-blue-600" : "text-gray-500 hover:text-gray-900"}`}
          >
            <div className="flex items-center gap-2"><ImageIcon size={16}/> File</div>
          </button>
          <button 
            onClick={() => { setMode("camera"); startCamera(); }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${mode === "camera" ? "bg-white shadow-sm text-blue-600" : "text-gray-500 hover:text-gray-900"}`}
          >
            <div className="flex items-center gap-2"><Camera size={16}/> Kamera</div>
          </button>
        </div>
      </div>

      <h1 className="text-3xl font-bold text-center mb-2 text-slate-800">
        {mode === "upload" ? "Unggah Gambar Sampah" : "Deteksi Langsung"}
      </h1>
      <p className="text-center text-slate-500 mb-8">
        {mode === "upload" 
          ? "Pilih file gambar untuk diklasifikasi oleh AI kami." 
          : "Ambil foto dan lihat jenis sampah secara real-time."}
      </p>

      {/* --- UPLOAD MODE --- */}
      {mode === "upload" && (
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer h-72 flex flex-col items-center justify-center transition-all duration-300 ${
                isDragActive
                  ? "border-blue-500 bg-blue-50/50 scale-[1.02]"
                  : "border-gray-200 hover:border-blue-400 hover:bg-gray-50 bg-white"
              }`}
            >
              <input {...getInputProps()} />
              <div className="bg-blue-100 text-blue-600 p-4 rounded-full mb-4">
                <CloudUpload className="h-8 w-8" />
              </div>
              {isDragActive ? (
                <p className="text-blue-600 font-semibold text-lg">Lepaskan di sini...</p>
              ) : (
                <div className="space-y-2">
                  <p className="text-slate-700 font-medium text-lg">Seret & lepas gambar</p>
                  <p className="text-slate-400 text-sm">Atau klik untuk menelusuri folder Anda</p>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4 flex flex-col items-stretch">
            <div className="flex justify-between items-center">
               <h2 className="text-lg font-semibold text-slate-700">Antrean Gambar</h2>
               <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full font-bold">{files.length} Item</span>
            </div>
            {files.length > 0 ? (
              <ul className="flex-1 h-64 overflow-y-auto space-y-3 p-2 bg-slate-50/50 rounded-xl border border-slate-100">
                {files.map((file) => (
                  <li key={file.name} className="flex items-center justify-between bg-white p-3 rounded-xl shadow-sm border border-slate-100 group transition-all hover:shadow-md">
                    <div className="flex items-center gap-4">
                      <Image
                        src={file.preview}
                        alt={file.name}
                        width={48}
                        height={48}
                        className="rounded-lg object-cover w-12 h-12"
                      />
                      <div className="text-sm">
                        <p className="font-medium text-slate-800 truncate w-32 md:w-40">{file.name}</p>
                        <p className="text-slate-400 text-xs">{(file.size / 1024).toFixed(1)} KB</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFile(file.name)}
                      className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="flex-1 h-64 flex flex-col items-center justify-center bg-slate-50/50 rounded-xl border border-slate-100 border-dashed">
                <ImageIcon className="h-10 w-10 text-slate-300 mb-2" />
                <p className="text-slate-400 text-sm">Belum ada file di antrean</p>
              </div>
            )}
          </div>

          <div className="md:col-span-2 mt-4 pt-6 border-t border-slate-100">
            <Button
              type="submit"
              className="w-full h-14 text-lg font-bold rounded-xl bg-blue-600 hover:bg-blue-700 hover:shadow-lg transition-all"
              disabled={files.length === 0 || loading}
            >
              {loading ? (
                <span className="flex items-center gap-2"><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"/> Memproses...</span>
              ) : (
                <span className="flex items-center gap-2"><Upload className="h-5 w-5"/> Unggah & Mulai Klasifikasi</span>
              )}
            </Button>
          </div>
        </form>
      )}

      {/* --- CAMERA MODE --- */}
      {mode === "camera" && (
        <div className="max-w-xl mx-auto flex flex-col items-center space-y-6">
          <div className="w-full relative bg-slate-900 rounded-3xl overflow-hidden aspect-[3/4] md:aspect-video flex items-center justify-center shadow-inner">
            {!capturedImage ? (
              <>
                <video 
                  ref={videoRef} 
                  autoPlay 
                  playsInline 
                  muted 
                  className="w-full h-full object-cover"
                />
                {!cameraActive && (
                  <p className="absolute text-slate-400">Silakan izinkan akses kamera...</p>
                )}
              </>
            ) : (
              <img src={capturedImage} alt="Captured" className="w-full h-full object-cover" />
            )}

            {isInferencing && (
              <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm flex flex-col items-center justify-center">
                 <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
                 <p className="text-white font-medium animate-pulse">Memproses dengan Gemini AI...</p>
              </div>
            )}
          </div>

          {!capturedImage ? (
             <Button 
               onClick={capturePhoto} 
               disabled={!cameraActive || isInferencing}
               className="w-20 h-20 rounded-full border-4 border-blue-100 bg-blue-600 hover:bg-blue-700 hover:scale-105 transition-all shadow-xl"
             >
               <Camera className="h-8 w-8 text-white" />
             </Button>
          ) : (
             <div className="w-full space-y-6">
                {liveInfo && (
                  <div className="bg-emerald-50 border border-emerald-100 p-6 rounded-2xl">
                    <div className="flex flex-col items-center text-center gap-2 mb-4">
                       <div className="bg-emerald-100 p-3 rounded-full text-emerald-600">
                          <CheckCircle className="h-8 w-8" />
                       </div>
                       <h3 className="text-2xl font-bold text-emerald-900">{liveInfo.classification}</h3>
                       <p className="text-emerald-700 bg-emerald-100/50 px-3 py-1 rounded-full text-sm font-medium">Akurasi: {(liveInfo.confidence * 100).toFixed(1)}% • Jumlah: {liveInfo.count}</p>
                    </div>
                  </div>
                )}
                <div className="flex gap-4">
                  <Button variant="outline" className="flex-1 h-12 rounded-xl" onClick={retakePhoto} disabled={loading}>
                    Ambil Ulang
                  </Button>
                  <Button className="flex-1 h-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold" onClick={saveLivePhoto} disabled={loading}>
                    {loading ? "Menyimpan..." : "Simpan Hasil"}
                  </Button>
                </div>
             </div>
          )}
        </div>
      )}
    </div>
  );
}
