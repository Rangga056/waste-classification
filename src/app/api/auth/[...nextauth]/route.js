// src/app/api/auth/[...nextauth]/route.js
import NextAuth from "next-auth"; // Impor NextAuth
import { authOptions } from "@/auth"; // Impor authOptions dari file konfigurasi Anda

const handler = NextAuth(authOptions); // Buat handler dari authOptions

export { handler as GET, handler as POST }; // Ekspor handler GET dan POST
