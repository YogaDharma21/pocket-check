import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export function DashboardSkeleton() {
  return (
    <div className="flex flex-1 flex-col justify-between">
      {/* Header Skeleton */}
      <header className="sticky top-0 z-50 border-b border-border bg-card shadow-xs">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6 sm:py-4 lg:px-8">
          <div className="flex shrink-0 items-center gap-2.5 select-none sm:gap-3.5">
            <Skeleton className="h-9 w-9 rounded-lg sm:h-10 sm:w-10" />
            <div className="space-y-1">
              <Skeleton className="h-6 w-32 rounded-lg sm:h-7 sm:w-36" />
              <Skeleton className="hidden h-3 w-28 rounded-md sm:block" />
            </div>
          </div>

          <div className="hidden items-center gap-2 rounded-full border border-border px-3.5 py-1.5 md:flex">
            <Skeleton className="h-4 w-44 rounded-md" />
          </div>

          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            <Skeleton className="h-9 w-9 rounded-lg" />
            <Skeleton className="h-9 w-9 rounded-lg" />
            <Skeleton className="h-9 w-9 rounded-full" />
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 pb-24 sm:px-6 md:py-8 md:pb-12 lg:px-8">
        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12 lg:gap-8">
          {/* Left Column Skeleton (lg:col-span-4) */}
          <div className="space-y-6 lg:col-span-4">
            {/* Progress Status Block Skeleton */}
            <Card className="overflow-hidden border-border shadow-xs">
              <CardContent className="space-y-4 p-5">
                <div className="flex items-start gap-3.5 select-none">
                  <Skeleton className="h-11 w-11 shrink-0 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between">
                      <Skeleton className="h-3.5 w-20 rounded-md" />
                      <Skeleton className="h-5 w-16 rounded-full" />
                    </div>
                    <Skeleton className="h-5 w-3/4 rounded-lg" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Skeleton className="h-2.5 w-full rounded-full" />
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-3.5 w-32 rounded-md" />
                    <Skeleton className="h-3.5 w-16 rounded-md" />
                  </div>
                </div>

                <div className="flex justify-between gap-2 border-t border-border pt-2">
                  <Skeleton className="h-8 w-24 rounded-lg" />
                  <Skeleton className="h-8 w-24 rounded-lg" />
                </div>
              </CardContent>
            </Card>

            {/* Destinations Card Skeleton */}
            <Card className="border-border shadow-xs">
              <CardHeader className="flex flex-row items-center justify-between p-4 pb-3">
                <div className="space-y-1">
                  <Skeleton className="h-3 w-20 rounded-md" />
                  <Skeleton className="h-4 w-32 rounded-md" />
                </div>
                <Skeleton className="h-5 w-12 rounded-md" />
              </CardHeader>
              <CardContent className="space-y-2 p-3 pt-0">
                {/* Desktop vertical skeleton items */}
                <div className="hidden flex-col gap-1.5 lg:flex">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card p-2.5"
                    >
                      <div className="flex min-w-0 flex-1 items-center gap-3">
                        <Skeleton className="h-8 w-8 shrink-0 rounded-lg" />
                        <Skeleton className="h-4 w-24 rounded-md" />
                      </div>
                      <Skeleton className="h-7 w-7 shrink-0 rounded-lg" />
                    </div>
                  ))}
                </div>

                {/* Mobile grid skeleton */}
                <div className="grid grid-cols-3 gap-2 lg:hidden">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="flex h-16 flex-col items-center justify-center gap-1.5 rounded-lg border border-border bg-card p-2.5"
                    >
                      <Skeleton className="h-5 w-5 rounded-md" />
                      <Skeleton className="h-3 w-12 rounded-md" />
                    </div>
                  ))}
                </div>

                <Skeleton className="mt-2 h-10 w-full rounded-lg" />
              </CardContent>
            </Card>
          </div>

          {/* Right Column / Workspace Skeleton (lg:col-span-8) */}
          <div className="space-y-5 lg:col-span-8">
            {/* Workspace Header Skeleton */}
            <div className="flex flex-col justify-between gap-4 rounded-lg border border-border bg-card p-4 sm:flex-row sm:items-center sm:p-5">
              <div className="flex items-center gap-3">
                <Skeleton className="h-12 w-12 shrink-0 rounded-lg" />
                <div className="space-y-1.5">
                  <Skeleton className="h-6 w-36 rounded-lg" />
                  <Skeleton className="h-3.5 w-28 rounded-md" />
                </div>
              </div>
              <Skeleton className="h-9 w-full rounded-lg sm:w-72" />
            </div>

            {/* Quick Add Bar Skeleton */}
            <Card className="border-border shadow-xs">
              <CardContent className="p-3.5 sm:p-4">
                <div className="flex flex-col gap-2.5 sm:flex-row">
                  <div className="flex w-full gap-2 sm:flex-1">
                    <Skeleton className="h-11 w-12 shrink-0 rounded-lg" />
                    <Skeleton className="h-11 flex-1 rounded-lg" />
                  </div>
                  <Skeleton className="h-11 w-full rounded-lg sm:w-28" />
                </div>
              </CardContent>
            </Card>

            {/* Checklist Items Skeleton */}
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <Card key={i}>
                  <CardContent className="flex flex-row items-center justify-between gap-3 p-3.5">
                    <div className="flex min-w-0 flex-1 items-center gap-3 select-none">
                      <Skeleton className="h-4 w-4 shrink-0 rounded-sm" />
                      <Skeleton className="h-7 w-7 shrink-0 rounded-lg" />
                      <div className="min-w-0 flex-1 space-y-1.5">
                        <Skeleton className="h-5 w-28 rounded-md sm:w-40" />
                        <Skeleton className="h-3.5 w-14 rounded-full" />
                      </div>
                    </div>
                    <Skeleton className="h-8 w-8 shrink-0 rounded-lg" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
