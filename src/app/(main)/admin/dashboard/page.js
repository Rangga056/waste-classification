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
import { ArrowUpRight, Users, Package, BookUser, ChartPie } from "lucide-react";
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
    <main className="flex min-h-screen flex-col gap-8 container mx-auto p-4 md:p-8">
      <div className="flex justify-between items-center">
        <Link href={"/"} className="text-xl md:text-3xl font-bold">
          Dashboard Admin
        </Link>
        <Link href="/submissions">
          <Button
            variant="outline"
            className="cursor-pointer hover:shadow-md transition-shadow text-lg"
          >
            List Pengiriman
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 grid-cols-[repeat(auto-fit,minmax(200px,1fr))] justify-center mx-auto w-full">
        <Card className="gap-2">
          <CardHeader className="flex flex-row items-center justify-center space-y-0 pb-2">
            <CardTitle className="text-xl font-medium">
              Total Pengiriman
            </CardTitle>
            <Package className="h-8 w-8 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-5xl text-center font-bold">
              {totalSubmissions[0].count}
            </div>
            <p className="text-base mt-2 text-center text-muted-foreground">
              Jumlah total sampah yang diunggah
            </p>
          </CardContent>
        </Card>
        <Card className="gap-2">
          <CardHeader className="flex flex-row items-center justify-center space-y-0 pb-2">
            <CardTitle className="text-xl font-medium">
              Total Pengguna
            </CardTitle>
            <Users className="h-8 w-8 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-5xl text-center font-bold">
              {totalUsers[0].count}
            </div>
            <p className="text-base text-center mt-2 text-muted-foreground">
              Jumlah total pengguna terdaftar
            </p>
          </CardContent>
        </Card>
        <Card className="gap-y-0 text-center">
          <CardHeader className="flex flex-row items-center justify-center space-y-0 pb-2">
            <CardTitle className="text-xl font-medium">
              Manajemen Pengguna
            </CardTitle>
            <BookUser className="w-8 h-8 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Kelola dan lihat daftar semua pengguna terdaftar.
            </p>
            <Link href="/admin/users">
              <Button className="cursor-pointer">Lihat Pengguna</Button>
            </Link>
          </CardContent>
        </Card>
        <Card className="gap-y-0 text-center">
          <CardHeader className="flex flex-row items-center justify-center space-y-0 pb-2">
            <CardTitle className="text-xl font-medium">
              Statistik Klasifikasi
            </CardTitle>
            <ChartPie className="w-8 h-8 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Lihat pengiriman yang dikelompokkan berdasarkan kategori sampah.
            </p>
            <Link href="/admin/classification">
              <Button className="cursor-pointer">Lihat Klasifikasi</Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-2xl font-bold">
            Pengiriman Terbaru
          </CardTitle>
          <Link href="/submissions">
            <Button
              variant="link"
              className="h-auto px-0 text-primary cursor-pointer text-lg"
            >
              Lihat Semua <ArrowUpRight className="ml-1 h-8 w-8" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {/* Gunakan komponen Client baru untuk tabel */}
          <RecentSubmissionsTable data={submissionsWithUser} />
        </CardContent>
      </Card>
    </main>
  );
}
