import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ShieldAlert, Package, Users, Trash2, ChartPie } from "lucide-react";

export default function Loading() {
  return (
    <main className="flex w-full flex-col gap-6 p-4 md:p-8 animate-in fade-in duration-500">
      {/* Header Skeleton */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <div className="space-y-2">
           <div className="flex items-center gap-2 text-blue-300">
              <ShieldAlert size={20} /> <Skeleton className="h-4 w-24" />
           </div>
           <Skeleton className="h-8 w-64" />
           <Skeleton className="h-4 w-48 mt-1" />
        </div>
        <div className="mt-4 md:mt-0 flex gap-3">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-48" />
        </div>
      </div>

      {/* KPI Cards Skeleton */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-3 w-full">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="border-slate-100 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-5 w-5 rounded-full" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-10 w-16 mb-2 mt-2" />
              <Skeleton className="h-3 w-40" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts & Tables Skeleton */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
        {/* Chart */}
        <Card className="border-slate-100 shadow-sm lg:col-span-1 h-[400px]">
          <CardHeader>
             <div className="flex items-center gap-2">
               <Skeleton className="w-9 h-9 rounded-lg" />
               <div className="space-y-2">
                  <Skeleton className="h-6 w-40" />
                  <Skeleton className="h-4 w-48" />
               </div>
             </div>
          </CardHeader>
          <CardContent className="space-y-6 mt-4">
             {[1, 2, 3, 4].map(i => (
                <div key={i} className="space-y-2">
                  <div className="flex justify-between">
                     <Skeleton className="h-4 w-20" />
                     <Skeleton className="h-4 w-12" />
                  </div>
                  <Skeleton className="h-2.5 w-full rounded-full" />
                </div>
             ))}
          </CardContent>
        </Card>

        {/* Table skeleton */}
        <Card className="border-slate-100 shadow-sm lg:col-span-2 overflow-hidden flex flex-col h-[400px]">
          <CardHeader className="flex flex-row items-center justify-between border-b border-slate-50 bg-slate-50/50">
             <div className="flex items-center gap-2">
               <Skeleton className="w-9 h-9 rounded-lg" />
               <div className="space-y-2">
                 <Skeleton className="h-6 w-48" />
                 <Skeleton className="h-4 w-56" />
               </div>
             </div>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
             {[1, 2, 3, 4, 5].map(i => (
                <Skeleton key={i} className="h-12 w-full" />
             ))}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
