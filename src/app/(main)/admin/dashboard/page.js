// src/app/(main)/admin/dashboard/page.js
import { authOptions } from "@/auth";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { db } from "@/db/db";
import { submissions, users } from "@/db/schema";
import { count, desc, inArray } from "drizzle-orm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { DataTable } from "@/components/ui/data-table"; // Hapus impor ini
import { RecentSubmissionsTable } from "./components/RecentSubmissionsTable"; // Impor komponen Client baru
import { ArrowUpRight, Users, Package } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

// Hapus definisi 'columns' dari sini karena akan dipindahkan ke Client Component
// const columns = [ ... ];

export default async function AdminDashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || session.user.role !== "admin") {
    redirect("/login");
  }

  const totalSubmissions = await db
    .select({ count: count() })
    .from(submissions);
  const totalUsers = await db.select({ count: count() }).from(users);

  const latestSubmissions = await db
    .select({
      id: submissions.id,
      username: submissions.username,
      uploadedAt: submissions.uploadedAt,
      userId: submissions.userId,
    })
    .from(submissions)
    .orderBy(desc(submissions.uploadedAt))
    .limit(10);

  const usersMap = new Map();
  const userIds = latestSubmissions.map((s) => s.userId);
  if (userIds.length > 0) {
    const fetchedUsers = await db
      .select()
      .from(users)
      .where(inArray(users.id, userIds));
    fetchedUsers.forEach((u) => usersMap.set(u.id, u));
  }

  const submissionsWithUser = latestSubmissions.map((s) => ({
    ...s,
    user: usersMap.get(s.userId),
  }));

  return (
    <main className="flex min-h-screen flex-col gap-8 p-8 md:p-12">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Dashboard Admin</h1>
        <Link href="/submissions">
          <Button variant="outline">Lihat Semua Pengiriman</Button>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Pengiriman
            </CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalSubmissions[0].count}
            </div>
            <p className="text-xs text-muted-foreground">
              Jumlah total sampah yang diunggah
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Pengguna
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUsers[0].count}</div>
            <p className="text-xs text-muted-foreground">
              Jumlah total pengguna terdaftar
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-2xl font-bold">
            Pengiriman Terbaru
          </CardTitle>
          <Link href="/submissions">
            <Button variant="link" className="h-auto px-0 text-primary">
              Lihat Semua <ArrowUpRight className="ml-1 h-4 w-4" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {/* Gunakan komponen Client baru untuk tabel */}
          <RecentSubmissionsTable data={submissionsWithUser} />
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold">
              Manajemen Pengguna
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Kelola dan lihat daftar semua pengguna terdaftar.
            </p>
            <Link href="/admin/users">
              <Button>Lihat Pengguna</Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold">
              Statistik Klasifikasi
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Lihat pengiriman yang dikelompokkan berdasarkan kategori sampah.
            </p>
            <Link href="/admin/classification">
              <Button>Lihat Klasifikasi</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
