// src/app/api/register/route.js
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/db/db";
import { users } from "@/db/schema";
import { v4 as uuidv4 } from "uuid"; // Untuk menghasilkan ID user yang unik

export async function POST(req) {
  try {
    const { name, email, password } = await req.json();

    // Validasi input
    if (!name || !email || !password) {
      return NextResponse.json(
        { message: "Nama, email, dan password harus diisi." },
        { status: 400 },
      );
    }

    // Periksa apakah email sudah terdaftar
    const existingUser = await db.query.users.findFirst({
      where: (u, { eq }) => eq(u.email, email),
    });

    if (existingUser) {
      return NextResponse.json(
        { message: "Email sudah terdaftar." },
        { status: 409 },
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10); // Salt rounds 10

    // Buat user baru di database
    const [newUser] = await db
      .insert(users)
      .values({
        id: uuidv4(),
        name,
        email,
        password: hashedPassword,
        role: "user",
      })
      .returning(); // <-- Tambahkan .returning()

    return NextResponse.json(
      // Ganti newUser.insertId menjadi newUser.id
      { message: "Registrasi berhasil!", userId: newUser.id },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error during registration:", error);
    return NextResponse.json(
      { message: "Terjadi kesalahan server internal." },
      { status: 500 },
    );
  }
}
