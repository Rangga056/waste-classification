// src/app/(main)/admin/dashboard/page.js
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/db/db";
import { submissions, users, classifications } from "@/db/schema";
import { count, desc, inArray } from "drizzle-orm";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { RecentSubmissionsTable } from "./components/RecentSubmissionsTable"; 
import { ArrowUpRight, Users, Package, BookUser, ChartPie, Trash2, ShieldAlert } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function AdminDashboardPage() {
  const session = await auth();

  if (!session || !session.user || session.user.role !== "admin") {
    redirect("/login");
  }

  // --- 1. Fetch Summary Stats ---
  const [totalSubmissions] = await db.select({ count: count() }).from(submissions);
  const [totalUsers] = await db.select({ count: count() }).from(users);
  
  // --- 2. Fetch Classification Stats for Bars Chart ---
  const classificationStats = await db
    .select({
      type: classifications.classificationResult,
      count: count(classifications.id)
    })
    .from(classifications)
    .groupBy(classifications.classificationResult);

  const totalClassifications = classificationStats.reduce((acc, curr) => acc + curr.count, 0);
  // Sort stats descending
  classificationStats.sort((a, b) => b.count - a.count);
  
  const mostCommonWaste = classificationStats.length > 0 ? classificationStats[0].type : "N/A";

  // --- 3. Fetch Latest Submissions ---
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

  // --- Color Map for Waste Types ---
  const getProgressColor = (type) => {
    const lower = type.toLowerCase();
    if (lower.includes("organik")) return "bg-emerald-500";
    if (lower.includes("plastik")) return "bg-blue-500";
    if (lower.includes("kertas")) return "bg-amber-500";
    if (lower.includes("kaca")) return "bg-cyan-500";
    if (lower.includes("logam")) return "bg-indigo-500";
    if (lower.includes("tidak ada")) return "bg-slate-400";
    return "bg-rose-500";
  };

  return (
    <main className="flex min-h-screen flex-col gap-6 p-4 md:p-8 bg-slate-50/50">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <div>
           <div className="flex items-center gap-2 text-blue-600 mb-1">
              <ShieldAlert size={20} /> <span className="font-semibold uppercase tracking-wider text-xs">Administrator</span>
           </div>
           <h1 className="text-2xl md:text-3xl font-extrabold text-slate-800">
             Dashboard Overview
           </h1>
           <p className="text-sm text-slate-500 mt-1">Pantau seluruh aktivitas klasifikasi dan kelola pengguna.</p>
        </div>
        <div className="mt-4 md:mt-0 flex gap-3">
          <Link href="/">
             <Button variant="outline" className="h-10 border-slate-200">Ke Beranda</Button>
          </Link>
          <Link href="/submissions">
            <Button className="h-10 bg-blue-600 hover:bg-blue-700 shadow-sm">
              List Semua Pengiriman <ArrowUpRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>

      {/* --- KPI CARDS --- */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-3 w-full">
        <Card className="border-slate-100 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Total Pengiriman</CardTitle>
            <Package className="h-5 w-5 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-black text-slate-800">{totalSubmissions.count}</div>
            <p className="text-xs mt-1 text-slate-400">Semua riwayat upload sistem</p>
          </CardContent>
        </Card>
        
        <Card className="border-slate-100 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Total Pengguna</CardTitle>
            <Users className="h-5 w-5 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-black text-slate-800">{totalUsers.count}</div>
            <p className="text-xs mt-1 text-slate-400">Akun terdaftar saat ini</p>
          </CardContent>
        </Card>

        <Card className="border-slate-100 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Sampah Terbanyak</CardTitle>
            <Trash2 className="h-5 w-5 text-rose-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl md:text-3xl font-black text-slate-800 truncate" title={mostCommonWaste}>{mostCommonWaste}</div>
            <p className="text-xs mt-1 text-slate-400">Kategori data paling dominan</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
        {/* --- DISTRIBUTION CHART --- */}
        <Card className="border-slate-100 shadow-sm lg:col-span-1 h-fit">
          <CardHeader>
             <div className="flex items-center gap-2">
               <div className="bg-indigo-100 p-2 rounded-lg"><ChartPie className="w-5 h-5 text-indigo-600" /></div>
               <div>
                  <CardTitle className="text-lg font-bold">Distribusi Kategori</CardTitle>
                  <CardDescription>Berdasarkan {totalClassifications} gambar terklasifikasi</CardDescription>
               </div>
             </div>
          </CardHeader>
          <CardContent className="space-y-5">
             {classificationStats.length === 0 ? (
               <p className="text-center text-sm text-slate-400 py-10">Belum ada data klasifikasi.</p>
             ) : (
               classificationStats.map(stat => {
                 const percentage = totalClassifications > 0 ? ((stat.count / totalClassifications) * 100).toFixed(1) : 0;
                 return (
                   <div key={stat.type} className="flex flex-col gap-1.5">
                     <div className="flex justify-between text-sm">
                       <span className="font-semibold text-slate-700 capitalize">{stat.type}</span>
                       <span className="text-slate-500 font-medium">{stat.count} <span className="text-xs text-slate-400 ml-1">({percentage}%)</span></span>
                     </div>
                     <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                       <div className={`h-full rounded-full ${getProgressColor(stat.type)}`} style={{ width: `${percentage}%` }}></div>
                     </div>
                   </div>
                 );
               })
             )}
             <div className="pt-4 mt-2 border-t border-slate-100">
                <Link href="/admin/classification">
                   <Button variant="outline" className="w-full text-sm">Lihat Analisis Detail</Button>
                </Link>
             </div>
          </CardContent>
        </Card>

        {/* --- RECENT SUBMISSIONS TABLE --- */}
        <Card className="border-slate-100 shadow-sm lg:col-span-2 overflow-hidden flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between border-b border-slate-50 bg-slate-50/50">
             <div className="flex items-center gap-2">
               <div className="bg-blue-100 p-2 rounded-lg"><Package className="w-5 h-5 text-blue-600" /></div>
               <div>
                 <CardTitle className="text-lg font-bold">Pengiriman Terbaru</CardTitle>
                 <CardDescription>10 entri deteksi sampah terakhir</CardDescription>
               </div>
             </div>
             <Link href="/submissions">
               <Button variant="ghost" className="text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                 Semua <ArrowUpRight className="ml-1 h-4 w-4" />
               </Button>
             </Link>
          </CardHeader>
          <CardContent className="p-0">
            <RecentSubmissionsTable data={submissionsWithUser} />
          </CardContent>
        </Card>
      </div>
      
      {/* --- QUICK ACTIONS --- */}
      <h2 className="text-xl font-bold text-slate-800 mt-4 px-1">Aksi Cepat</h2>
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
         <Link href="/admin/users" className="group">
           <Card className="border-slate-100 shadow-sm hover:border-blue-200 hover:shadow-md transition-all cursor-pointer">
              <CardContent className="p-6 flex items-center justify-between">
                 <div className="flex items-center gap-4">
                    <div className="bg-slate-100 p-3 rounded-xl group-hover:bg-blue-100 transition-colors"><BookUser className="w-6 h-6 text-slate-600 group-hover:text-blue-600" /></div>
                    <div>
                       <h3 className="font-bold text-slate-800 group-hover:text-blue-700 transition-colors">Manajemen Pengguna</h3>
                       <p className="text-sm text-slate-500">Atur role, hapus, atau kelola akun</p>
                    </div>
                 </div>
                 <ArrowUpRight className="text-slate-300 group-hover:text-blue-500 transition-colors" />
              </CardContent>
           </Card>
         </Link>
      </div>

    </main>
  );
}
