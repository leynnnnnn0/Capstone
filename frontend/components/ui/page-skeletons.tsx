import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TableCell, TableRow } from "@/components/ui/table";

export function TableSkeletonRows({ columns, rows = 6 }: { columns: number; rows?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <TableRow key={rowIndex}>
          {Array.from({ length: columns }).map((__, columnIndex) => (
            <TableCell key={columnIndex}>
              <Skeleton className={columnIndex === 0 ? "h-4 w-28" : "h-4 w-full max-w-32"} />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  );
}

export function CustomerCardGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div className="space-y-2">
              <Skeleton className="h-3 w-32" />
              <Skeleton className="h-5 w-24" />
            </div>
            <Skeleton className="h-5 w-20 rounded-full" />
          </div>
          <div className="space-y-3">
            <Skeleton className="h-4 w-48 max-w-full" />
            <Skeleton className="h-4 w-64 max-w-full" />
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-4 w-16" />
          </div>
        </div>
      ))}
    </>
  );
}

export function DetailPageSkeleton({ customer = false }: { customer?: boolean }) {
  const cardClass = customer ? "border-slate-200 bg-white" : "bg-card";

  return (
    <div className="space-y-6" aria-label="Loading details">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-3">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-3 w-36" />
          <Skeleton className="h-6 w-52" />
        </div>
        <Skeleton className="h-7 w-24 rounded-full" />
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card className={cardClass}>
            <CardHeader>
              <Skeleton className="h-4 w-36" />
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="space-y-2">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-4 w-40 max-w-full" />
                </div>
              ))}
            </CardContent>
          </Card>
          <Skeleton className="h-64 w-full rounded-lg" />
        </div>
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, cardIndex) => (
            <Card key={cardIndex} className={cardClass}>
              <CardHeader>
                <Skeleton className="h-4 w-32" />
              </CardHeader>
              <CardContent className="space-y-3">
                {Array.from({ length: 3 }).map((__, rowIndex) => (
                  <Skeleton key={rowIndex} className="h-4 w-full" />
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

export function FormPageSkeleton() {
  return (
    <div className="space-y-5" aria-label="Loading form">
      <div className="space-y-2">
        <Skeleton className="h-3 w-32" />
        <Skeleton className="h-7 w-52" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </div>
      <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
        <Card>
          <CardContent className="grid gap-4 pt-6 sm:grid-cols-2">
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className="space-y-2">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="space-y-4 pt-6">
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export function CalendarPageSkeleton() {
  return (
    <div className="rounded-lg border bg-card p-4" aria-label="Loading calendar">
      <div className="mb-5 flex items-center justify-between gap-4">
        <Skeleton className="h-9 w-40" />
        <Skeleton className="h-9 w-28" />
      </div>
      <div className="grid grid-cols-7 gap-2">
        {Array.from({ length: 42 }).map((_, index) => (
          <Skeleton key={index} className="h-20 rounded-md" />
        ))}
      </div>
    </div>
  );
}

export function SettingsPageSkeleton() {
  return (
    <div className="space-y-5" aria-label="Loading settings">
      <div className="space-y-2">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-7 w-52" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </div>
      <Skeleton className="h-10 w-52 rounded-lg" />
      <Card>
        <CardHeader className="space-y-2">
          <Skeleton className="h-5 w-36" />
          <Skeleton className="h-4 w-72 max-w-full" />
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="space-y-2">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-10 w-full" />
            </div>
          ))}
          <Skeleton className="h-10 w-28" />
        </CardContent>
      </Card>
    </div>
  );
}
