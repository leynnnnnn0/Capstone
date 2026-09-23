import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export function AdminMobileRecord({ className, ...props }: HTMLAttributes<HTMLElement>) {
  return (
    <article
      className={cn(
        "relative overflow-hidden rounded-lg border bg-white p-4",
        className,
      )}
      {...props}
    />
  );
}

export function AdminMobileRecordDetail({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-md border bg-muted/40 px-3 py-2.5",
        className,
      )}
      {...props}
    />
  );
}
