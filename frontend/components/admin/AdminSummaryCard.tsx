import type { ComponentType } from "react";

import { cn } from "@/lib/utils";

export type SummaryTone = "blue" | "mist" | "light" | "slate";

const toneClasses: Record<SummaryTone, { surface: string; icon: string }> = {
  blue: { surface: "bg-[#dcecf8]", icon: "bg-[#162d4a]" },
  mist: { surface: "bg-[#e8f0f6]", icon: "bg-[#315b7d]" },
  light: { surface: "bg-[#f1f5f8]", icon: "bg-[#608db9]" },
  slate: { surface: "bg-[#e4eaf0]", icon: "bg-[#405a70]" },
};

export default function AdminSummaryCard({
  label,
  value,
  icon: Icon,
  tone = "mist",
  eyebrow = "Live operations",
  description,
}: {
  label: string;
  value: number | string;
  icon: ComponentType<{ className?: string }>;
  tone?: SummaryTone;
  eyebrow?: string;
  description?: string;
}) {
  const palette = toneClasses[tone];

  return (
    <article
      className={cn(
        "relative min-h-[104px] min-w-0 overflow-hidden rounded-xl p-3 text-[#17324d] shadow-[0_14px_38px_rgba(22,45,74,0.055)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_20px_55px_rgba(22,45,74,0.11)] sm:min-h-36 sm:rounded-[1.5rem] sm:p-5",
        palette.surface,
      )}
    >
      <div className="relative flex h-full min-h-20 flex-col justify-between gap-2 sm:min-h-24 sm:gap-5">
        <div className="flex items-start justify-between gap-2 sm:gap-3">
          <div className="min-w-0">
            <p className="text-[7px] font-bold uppercase tracking-[0.12em] text-[#6f879b] sm:text-[9px] sm:tracking-[0.2em]">
              {eyebrow}
            </p>
            <h2 className="mt-1 text-[11px] font-semibold leading-tight sm:mt-2 sm:text-sm">
              {label}
            </h2>
          </div>
          <span className={cn("flex size-7 shrink-0 items-center justify-center rounded-lg text-white shadow-sm sm:size-10 sm:rounded-2xl", palette.icon)}>
            <Icon className="size-3.5 sm:size-4" />
          </span>
        </div>
        <div>
          <p className="truncate text-xl font-semibold tracking-[-0.05em] sm:text-3xl" title={String(value)}>
            {value}
          </p>
          {description && (
            <p className="mt-1 line-clamp-1 text-[8px] text-[#657b8f] sm:mt-2 sm:text-xs">
              {description}
            </p>
          )}
        </div>
        <Icon className="pointer-events-none absolute -bottom-3 -right-2 size-14 text-[#315b7d] opacity-[0.055] sm:-bottom-5 sm:-right-3 sm:size-24" />
      </div>
    </article>
  );
}
