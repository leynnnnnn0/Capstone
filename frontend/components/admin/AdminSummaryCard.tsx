import type { ComponentType } from "react";

export type SummaryTone = "blue" | "mist" | "light" | "slate";

export default function AdminSummaryCard({
  label,
  value,
  icon: Icon,
  eyebrow = "Operations",
  description,
}: {
  label: string;
  value: number | string;
  icon: ComponentType<{ className?: string }>;
  tone?: SummaryTone;
  eyebrow?: string;
  description?: string;
}) {
  return (
    <article className="min-h-28 border-t py-4 text-left sm:min-h-40 sm:py-6">
      <div className="flex items-start justify-between gap-2 sm:gap-4">
        <div>
          <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-[#8194a7] sm:text-[10px] sm:tracking-[0.16em]">{eyebrow}</p>
          <h2 className="mt-2 text-xs font-medium leading-4 text-[#496078] sm:mt-3 sm:text-sm">{label}</h2>
        </div>
        <Icon className="mt-0.5 size-4 shrink-0 text-[#64879a] sm:size-[18px]" />
      </div>
      <p className="mt-1 truncate text-2xl font-semibold tracking-tight text-[#2d425b] sm:text-3xl" title={String(value)}>{value}</p>
      {description && <p className="mt-1.5 line-clamp-2 text-[11px] leading-4 text-[#64879a] sm:mt-2 sm:line-clamp-1 sm:text-xs">{description}</p>}
    </article>
  );
}
