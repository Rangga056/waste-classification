import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function Loading() {
  return (
    <main className="flex min-h-screen flex-col gap-8 p-4 md:p-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-40" />
      </div>

      <Card>
        <CardHeader>
          <Skeleton className="h-7 w-48" />
        </CardHeader>
        <CardContent>
          <div className="border border-slate-100 rounded-xl overflow-hidden mt-4">
             <div className="bg-slate-50 h-10 w-full border-b border-slate-100" />
             <div className="p-4 space-y-4">
                 {[1, 2, 3, 4, 5, 6].map(i => (
                    <div key={i} className="flex gap-4">
                      <Skeleton className="h-4 w-1/4" />
                      <Skeleton className="h-4 w-1/4" />
                      <Skeleton className="h-4 w-1/4" />
                    </div>
                 ))}
             </div>
         </div>
        </CardContent>
      </Card>
    </main>
  );
}
