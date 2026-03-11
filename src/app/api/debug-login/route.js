import { NextResponse } from "next/server";
import { db } from "@/db/db";

export async function GET(req) {
  try {
    const allUsers = await db.query.users.findMany();
    
    // safe debug representation
    const sanitized = allUsers.map(u => ({
      id: u.id,
      email: u.email,
      role: u.role,
      hasPassword: !!u.password,
      passwordLen: u.password?.length,
      passwordStart: u.password?.substring(0, 7)
    }));

    return NextResponse.json({ users: sanitized });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
