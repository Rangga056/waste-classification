import { NextResponse } from "next/server";
import { db } from "@/db/db";
import { users } from "@/db/schema";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";

export async function GET(req) {
  try {
    const defaultPassword = "password123";
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);
    
    // Find admin user or just update directly by email
    const emailToFix = req.nextUrl.searchParams.get("email") || "admin@gmail.com";
    
    const [updatedUser] = await db
      .update(users)
      .set({ 
        password: hashedPassword,
        role: "admin" // ensure strictly 'admin' without spaces
      })
      .where(eq(users.email, emailToFix))
      .returning();

    if (!updatedUser) {
      return NextResponse.json({ error: `User with email ${emailToFix} not found` }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true, 
      message: `Account repaired! You can now log in at /login with:`,
      email: updatedUser.email,
      password: defaultPassword,
      role: updatedUser.role
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
