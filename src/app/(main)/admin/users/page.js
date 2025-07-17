// src/app/(main)/admin/users/page.js
import { authOptions } from "@/auth"; // Impor authOptions
import { getServerSession } from "next-auth"; // Impor getServerSession
import { redirect } from "next/navigation";
import { db } from "@/db/db";
import { users, submissions } from "@/db/schema";
import { count, eq } from "drizzle-orm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { UsersTable } from "./components/UsersTable"; // Impor komponen Client baru

export default async function AdminUsersPage() {
  const session = await getServerSession(authOptions); // Dapatkan sesi di server

  // Proteksi rute: Hanya admin yang bisa mengakses
  if (!session || !session.user || session.user.role !== "admin") {
    redirect("/login");
  }

  // Ambil semua pengguna
  const allUsers = await db.select().from(users);

  // Ambil jumlah submission per pengguna
  const submissionCounts = await db
    .select({
      userId: submissions.userId,
      count: count(submissions.id).as("count"),
    })
    .from(submissions)
    .groupBy(submissions.userId);

  const submissionCountMap = new Map(
    submissionCounts.map((row) => [row.userId, row.count]),
  );

  // Gabungkan jumlah submission ke data pengguna
  const usersWithCounts = allUsers.map((user) => ({
    ...user,
    submissionCount: submissionCountMap.get(user.id) || 0,
  }));

  return (
    <main className="flex min-h-screen flex-col gap-8 p-8 md:p-12">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Daftar Pengguna</h1>
        <Link href="/admin/dashboard">
          <Button variant="outline">← Kembali ke Dashboard</Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Semua Pengguna</CardTitle>
        </CardHeader>
        <CardContent>
          <UsersTable data={usersWithCounts} />
        </CardContent>
      </Card>
    </main>
  );
}
