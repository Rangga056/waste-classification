import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft } from "lucide-react";

export default function Loading() {
  return (
    <main className="flex w-full flex-col gap-6 p-4 md:p-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <div className="space-y-3">
          <div className="inline-flex text-blue-300 items-center gap-1 mb-2">
            <ArrowLeft className="w-4 h-4" /> <Skeleton className="h-4 w-32" />
          </div>
          <Skeleton className="h-8 w-64 md:w-96" />
          <Skeleton className="h-4 w-72 md:w-full max-w-lg mt-1" />
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
         <div className="flex justify-between items-center mb-6">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-10 w-24" />
         </div>
         <div className="border border-slate-100 rounded-xl overflow-hidden">
             <div className="bg-slate-50 h-10 w-full border-b border-slate-100" />
             <div className="p-2 space-y-2">
                 {[1, 2, 3, 4, 5, 6, 7].map(i => (
                    <Skeleton key={i} className="h-16 w-full rounded-xl" />
                 ))}
             </div>
         </div>
      </div>
    </main>
  );
}
