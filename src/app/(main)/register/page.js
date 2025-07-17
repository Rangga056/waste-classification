// src/app/(main)/register/page.js
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { toast } from "sonner";
import { signIn } from "next-auth/react"; // Impor dari "next-auth/react"

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    toast.info("Mencoba mendaftar...", { duration: 2000 });

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success(
          data.message || "Registrasi berhasil! Mengarahkan ke login...",
          { duration: 3000 }
        );
        const signInResult = await signIn("credentials", {
          redirect: false,
          username: email,
          password,
        });

        if (signInResult?.error) {
          toast.error(
            "Registrasi berhasil, tetapi gagal masuk otomatis. Silakan login manual.",
            { duration: 5000 }
          );
          router.push("/login");
        } else {
          toast.success("Registrasi dan login berhasil! Mengarahkan...", {
            duration: 2000,
          });
          router.push("/");
        }
      } else {
        toast.error(data.message || "Registrasi gagal.", { duration: 3000 });
        console.error("Registration Error:", data.message);
      }
    } catch (error) {
      console.error("Registration exception:", error);
      toast.error("Terjadi kesalahan tak terduga saat mendaftar.", {
        duration: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-blue-50 to-emerald-50">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
        <h1 className="text-3xl font-bold text-center mb-6 text-gray-800">
          Daftar Akun Baru
        </h1>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label
              htmlFor="name"
              className="block text-lg font-medium text-gray-700 mb-2"
            >
              Nama Lengkap
            </Label>
            <Input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="px-4 py-2 h-12 text-base border-gray-300 rounded-lg w-full focus:ring-blue-500 focus:border-blue-500"
              placeholder="Nama Anda"
              required
            />
          </div>
          <div>
            <Label
              htmlFor="email"
              className="block text-lg font-medium text-gray-700 mb-2"
            >
              Email
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="px-4 py-2 h-12 text-base border-gray-300 rounded-lg w-full focus:ring-blue-500 focus:border-blue-500"
              placeholder="contoh@email.com"
              required
            />
          </div>
          <div>
            <Label
              htmlFor="password"
              className="block text-lg font-medium text-gray-700 mb-2"
            >
              Password
            </Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="px-4 py-2 h-12 text-base border-gray-300 rounded-lg w-full focus:ring-blue-500 focus:border-blue-500"
              placeholder="Minimal 6 karakter"
              required
              minLength={6}
            />
          </div>
          <Button
            type="submit"
            className="w-full h-12 text-lg font-semibold bg-green-600 hover:bg-green-700 shadow-lg transition-all duration-300"
            disabled={loading}
          >
            {loading ? "Mendaftar..." : "Daftar"}
          </Button>
        </form>
        <p className="text-center text-sm text-gray-600 mt-4">
          Sudah punya akun?{" "}
          <Link href="/login" className="text-blue-600 hover:underline">
            Masuk di sini
          </Link>
        </p>
      </div>
    </div>
  );
}
