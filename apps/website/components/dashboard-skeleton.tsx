import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function DashboardSkeleton() {
  return (
    <div className="flex-1 flex flex-col justify-between">
      {/* Header Skeleton */}
      <header className="bg-card border-b border-border sticky top-0 z-50 shadow-xs">
        <div className="max-w-xl mx-auto px-3 sm:px-4 py-2.5 sm:py-4 flex justify-between items-center gap-2">
          <div className="flex items-center gap-2 sm:gap-3 select-none shrink-0">
            <Skeleton className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl" />
            <Skeleton className="h-6 sm:h-7 w-32 sm:w-36 rounded-lg" />
          </div>
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            <Skeleton className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl" />
            <Skeleton className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl" />
            <Skeleton className="w-8 h-8 sm:w-9 sm:h-9 rounded-full" />
          </div>
        </div>
      </header>

      <main className="w-full max-w-xl mx-auto p-4 flex-1 space-y-6 pb-24 md:py-8">
        {/* Progress Status Block Skeleton */}
        <Card className="py-0">
          <CardContent className="p-5">
            <div className="flex items-start gap-4 select-none">
              <Skeleton className="w-10 h-10 rounded-xl shrink-0 hidden sm:block mt-1" />
              <div className="flex-1 space-y-3">
                <Skeleton className="h-6 w-3/4 rounded-lg" />
                <Skeleton className="h-4 w-full rounded-full" />
                <Skeleton className="h-4 w-1/2 rounded-md" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Routine Switcher Skeleton */}
        <div className="space-y-3">
          <Skeleton className="h-4 w-44 rounded-md" />
          <div className="grid grid-cols-3 gap-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-[76px] rounded-2xl border border-border bg-card p-3.5 flex flex-col items-center justify-center gap-2 shadow-xs"
              >
                <Skeleton className="w-5 h-5 rounded-md" />
                <Skeleton className="h-3.5 w-14 rounded-md" />
              </div>
            ))}
          </div>
        </div>

        {/* Filter & Checklist Section Skeleton */}
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-end gap-2">
              <Skeleton className="h-6 w-24 rounded-lg" />
              <Skeleton className="h-6 w-20 rounded-lg" />
            </div>

            <div className="grid grid-cols-3 gap-1.5 p-1 bg-muted/60 rounded-2xl">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-8 rounded-xl" />
              ))}
            </div>
          </div>

          {/* Checklist Items Skeleton */}
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="py-0">
                <CardContent className="p-3.5 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 select-none flex-1 min-w-0">
                    <Skeleton className="w-4 h-4 rounded-sm shrink-0" />
                    <Skeleton className="w-7 h-7 rounded-xl shrink-0" />
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <Skeleton className="h-5 w-28 sm:w-36 rounded-md" />
                      <Skeleton className="h-3.5 w-14 rounded-full" />
                    </div>
                  </div>
                  <Skeleton className="w-8 h-8 rounded-xl shrink-0" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Add Item Form Skeleton */}
        <Card className="py-0">
          <div className="p-4 pb-2">
            <Skeleton className="h-3.5 w-40 rounded-md" />
          </div>
          <CardContent className="p-4 pt-0">
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="flex gap-2 sm:flex-1">
                <Skeleton className="w-12 h-10 rounded-xl shrink-0" />
                <Skeleton className="h-10 flex-1 rounded-xl" />
              </div>
              <Skeleton className="h-10 w-full sm:w-16 rounded-xl" />
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
