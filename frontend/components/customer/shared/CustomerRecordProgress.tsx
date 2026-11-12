import { Check } from "lucide-react";

import { formatCustomerDateTime } from "@/features/customer/customer-utils";
import { CustomerStatus } from "@/features/customer/status";
import type { CustomerRemark } from "@/features/customer/types";
import { cn } from "@/lib/utils";

export default function CustomerRecordProgress({
  title,
  status,
  statusLabel,
  showStatusLabel = true,
  stages,
  remarks,
}: {
  title: string;
  status: CustomerStatus;
  statusLabel: string;
  showStatusLabel?: boolean;
  stages: { status: CustomerStatus; label: string; fallbackTimestamp?: string }[];
  remarks: CustomerRemark[];
}) {
  if (status === CustomerStatus.Cancelled) return null;

  const paused = status === CustomerStatus.NoShow;
  const stageStatus = status === CustomerStatus.Rescheduled ? CustomerStatus.Confirmed : status;
  const currentIndex = stages.findIndex((stage) => stage.status === stageStatus);

  return (
    <section aria-label={title} className="rounded-xl border bg-card px-4 py-4 sm:px-6">
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <h2 className="text-sm font-semibold">{title}</h2>
        {showStatusLabel && (
          <p className={cn("text-sm font-medium", paused ? "text-rose-700" : "text-primary")}>{statusLabel}</p>
        )}
      </div>

      {!paused && (
        <ol className="grid" style={{ gridTemplateColumns: `repeat(${stages.length}, minmax(0, 1fr))` }}>
          {stages.map((stage, index) => {
            const current = index === currentIndex;
            const complete = index < currentIndex || status === CustomerStatus.Completed;
            const timestamp = current || complete
              ? remarks.find((remark) => remark.action === stage.status)?.created_at ?? stage.fallbackTimestamp
              : undefined;
            return (
              <li
                key={stage.status}
                aria-current={current ? "step" : undefined}
                className="relative flex min-w-0 flex-col items-center px-1 text-center sm:px-2"
              >
                <div className="flex w-full justify-center">
                  <span
                    aria-hidden="true"
                    className={cn(
                      "relative z-10 grid size-7 shrink-0 place-items-center rounded-full border",
                      complete && "border-emerald-700 bg-emerald-700 text-white",
                      current && !complete && "border-primary bg-primary text-primary-foreground ring-2 ring-primary/20",
                      !current && !complete && "border-border bg-muted text-muted-foreground",
                    )}
                  >
                    {complete ? <Check className="size-4" /> : <span className="size-1.5 rounded-full bg-current" />}
                  </span>
                  {index < stages.length - 1 && (
                    <span aria-hidden="true" className={cn(
                      "absolute left-[calc(50%+1.125rem)] top-3.5 w-[calc(100%-2.25rem)] border-t-2 border-dotted",
                      index < currentIndex ? "border-emerald-600" : "border-border",
                    )} />
                  )}
                </div>
                <p className={cn("mt-2 max-w-full break-words text-xs sm:text-sm", current ? "font-semibold text-primary" : "text-muted-foreground")}>
                  {stage.label}
                  {complete && !current && <span className="sr-only"> (complete)</span>}
                  {!complete && !current && <span className="sr-only"> (upcoming)</span>}
                </p>
                {timestamp && (
                  <time dateTime={timestamp} className="mt-1 text-[11px] leading-tight text-muted-foreground sm:text-xs">
                    {formatCustomerDateTime(timestamp)}
                  </time>
                )}
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
