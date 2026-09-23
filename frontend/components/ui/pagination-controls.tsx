"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type PaginationMeta = {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from?: number | null;
  to?: number | null;
};

type PaginationControlsProps = {
  meta: PaginationMeta;
  loading?: boolean;
  className?: string;
  onPageChange: (page: number) => void;
};

export function PaginationControls({ meta, loading = false, className, onPageChange }: PaginationControlsProps) {
  const from = meta.from ?? (meta.total > 0 ? (meta.current_page - 1) * meta.per_page + 1 : 0);
  const to = meta.to ?? Math.min(meta.current_page * meta.per_page, meta.total);
  const canGoBack = meta.current_page > 1 && !loading;
  const canGoNext = meta.current_page < meta.last_page && !loading;

  return (
    <div className={cn("flex flex-col gap-3 rounded-lg border bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between", className)}>
      <p className="text-xs text-muted-foreground sm:text-sm">
        Showing <span className="font-medium text-foreground">{from}</span> to{" "}
        <span className="font-medium text-foreground">{to}</span> of{" "}
        <span className="font-medium text-foreground">{meta.total}</span>
      </p>

      <div className="flex items-center justify-between gap-2 sm:justify-end">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="rounded-md"
          disabled={!canGoBack}
          onClick={() => onPageChange(Math.max(1, meta.current_page - 1))}
        >
          <ChevronLeft className="size-3.5" />
          Previous
        </Button>
        <span className="whitespace-nowrap rounded-md bg-muted px-3 py-1.5 text-xs font-medium text-muted-foreground">
          Page {meta.current_page} of {meta.last_page}
        </span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="rounded-md"
          disabled={!canGoNext}
          onClick={() => onPageChange(Math.min(meta.last_page, meta.current_page + 1))}
        >
          Next
          <ChevronRight className="size-3.5" />
        </Button>
      </div>
    </div>
  );
}
