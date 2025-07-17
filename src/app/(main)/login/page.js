// src/app/login/page.js
"use client";

import { useState } from "react";
import { signIn } from "next-auth/react"; // Impor dari "next-auth/react"
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { toast } from "sonner";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    toast.info("Mencoba masuk...", { duration: 2000 });

    try {
      const result = await signIn("credentials", {
        redirect: false,
        username,
        password,
      });

      if (result?.error) {
        toast.error("Gagal masuk. Periksa username dan password Anda.", {
          duration: 3000,
        });
        console.error("Login Error:", result.error);
      } else {
        toast.success("Berhasil masuk! Mengarahkan...", { duration: 2000 });
        router.push("/");
      }
    } catch (error) {
      console.error("Login exception:", error);
      toast.error("Terjadi kesalahan tak terduga saat login.", {
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
          Login
        </h1>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label
              htmlFor="username"
              className="block text-lg font-medium text-gray-700 mb-2"
            >
              Username (Email)
            </Label>
            <Input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="px-4 py-2 h-12 text-base border-gray-300 rounded-lg w-full focus:ring-blue-500 focus:border-blue-500"
              placeholder="admin123@example.com"
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
              placeholder="123456"
              required
            />
          </div>
          <Button
            type="submit"
            className="w-full h-12 text-lg font-semibold bg-green-600 hover:bg-green-700 shadow-lg transition-all duration-300"
            disabled={loading}
          >
            {loading ? "Memproses..." : "Masuk"}
          </Button>
        </form>
        <p className="text-center mt-6">
          Belum punya akun? Daftar{" "}
          <Link
            href={"/register"}
            className="text-blue-600 underline underline-offset-1 cursor-pointer"
          >
            disini
          </Link>
        </p>
      </div>
    </div>
  );
}
