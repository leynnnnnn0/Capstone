"use client";

import { useState } from "react";
import {
  CalendarClock,
  MessageSquare,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

import type { CustomerRemark } from "@/features/customer/types";

const INITIAL_VISIBLE = 3;

const actionStyles: Record<
  string,
  { dot: string; badge: string; label: string }
> = {
  confirmed: {
    dot: "bg-primary",
    badge: "bg-primary/10 text-primary",
    label: "Confirmed",
  },
  rescheduled: {
    dot: "bg-amber-400",
    badge: "bg-amber-100 text-amber-700",
    label: "Rescheduled",
  },
  on_the_way: {
    dot: "bg-blue-500",
    badge: "bg-blue-100 text-blue-700",
    label: "On The Way",
  },
  in_progress: {
    dot: "bg-purple-500",
    badge: "bg-purple-100 text-purple-700",
    label: "On Going",
  },
  on_going: {
    dot: "bg-purple-500",
    badge: "bg-purple-100 text-purple-700",
    label: "On Going",
  },
  completed: {
    dot: "bg-green-500",
    badge: "bg-green-100 text-green-700",
    label: "Completed",
  },
  cancelled: {
    dot: "bg-red-400",
    badge: "bg-red-100 text-red-600",
    label: "Cancelled",
  },
  reopened: {
    dot: "bg-sky-400",
    badge: "bg-sky-100 text-sky-700",
    label: "Reopened",
  },
};

export default function CustomerActivityLog({
  remarks,
  emptyDescription = "Updates from the SOG team will appear here.",
}: {
  remarks: CustomerRemark[];
  emptyDescription?: string;
}) {
  const [expanded, setExpanded] = useState(false);

  const hasMore = remarks.length > INITIAL_VISIBLE;
  const visibleRemarks = expanded ? remarks : remarks.slice(0, INITIAL_VISIBLE);
  const hiddenCount = remarks.length - INITIAL_VISIBLE;

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="mb-5 text-xs font-semibold uppercase tracking-widest text-primary">
        Activity Log
      </h2>

      {remarks.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
          <CalendarClock size={28} className="text-slate-400/60" />
          <p className="text-sm text-slate-500">No activity yet.</p>
          <p className="text-xs text-slate-400">{emptyDescription}</p>
        </div>
      ) : (
        <>
          <ol className="relative ml-2 space-y-0 border-l border-slate-200">
            {visibleRemarks.map((remark) => {
              const style = actionStyles[remark.action] ?? {
                dot: "bg-slate-400",
                badge: "bg-slate-100 text-slate-600",
                label: toTitleCase(remark.action),
              };

              return (
                <li key={remark.id} className="relative pb-6 pl-6 last:pb-0">
                  <span
                    className={`absolute top-1 -left-[5px] h-2.5 w-2.5 rounded-full ring-2 ring-white ${style.dot}`}
                  />
                  <div className="flex flex-col gap-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize ${style.badge}`}
                      >
                        {style.label}
                      </span>
                      <span className="text-[11px] text-slate-500">
                        {formatDateTime(remark.created_at)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">
                      By{" "}
                      <span className="font-medium text-slate-950">
                        {remark.user?.full_name ?? "SOG Team"}
                      </span>
                    </p>
                    {remark.message && (
                      <div className="mt-1.5 flex items-start gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                        <MessageSquare
                          size={12}
                          className="mt-0.5 shrink-0 text-slate-500"
                        />
                        <p className="text-xs leading-relaxed text-slate-900">
                          {remark.message}
                        </p>
                      </div>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>

          {hasMore && (
            <button
              onClick={() => setExpanded((prev) => !prev)}
              className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-md border border-slate-200 bg-slate-50 py-1.5 text-xs font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
            >
              {expanded ? (
                <>
                  <ChevronUp size={13} />
                  Show less
                </>
              ) : (
                <>
                  <ChevronDown size={13} />
                  Show {hiddenCount} more{" "}
                  {hiddenCount === 1 ? "activity" : "activities"}
                </>
              )}
            </button>
          )}
        </>
      )}
    </div>
  );
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function toTitleCase(value: string) {
  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}
