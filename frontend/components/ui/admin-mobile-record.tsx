import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export function AdminMobileRecord({ className, ...props }: HTMLAttributes<HTMLElement>) {
  return (
    <article
      className={cn(
        "relative overflow-hidden rounded-[1.25rem] border border-[#dce4ea] bg-white p-4 shadow-[0_12px_32px_rgba(22,45,74,0.065)]",
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
        "rounded-xl border border-[#e4ebf0] bg-[#f4f7f9] px-3 py-2.5",
        className,
      )}
      {...props}
    />
  );
}
