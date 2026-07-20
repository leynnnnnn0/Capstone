import type { LucideIcon } from "lucide-react";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

type AdminPageHeaderProps = {
  eyebrow: string;
  title: ReactNode;
  description: ReactNode;
  backHref?: string;
  backLabel?: string;
  icon: LucideIcon;
  recordLabel: string;
  recordValue: ReactNode;
  actions?: ReactNode;
};

export function AdminPageHeader({
  eyebrow,
  title,
  description,
  backHref,
  backLabel,
  icon: Icon,
  recordLabel,
  recordValue,
  actions,
}: AdminPageHeaderProps) {
  return (
    <section data-slot="admin-page-header" className="flex flex-col gap-5 rounded-[1.75rem] bg-[#162d4a] p-5 text-white shadow-[0_22px_65px_rgba(22,45,74,0.14)] sm:p-7 md:flex-row md:items-end md:justify-between">
      <div className="min-w-0">
        {backHref && backLabel && (
          <Link
            href={backHref}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-white/60 transition-colors hover:text-white"
          >
            <ArrowLeft className="size-3.5" />
            {backLabel}
          </Link>
        )}
        <p className={backHref ? "mt-6 text-[10px] font-bold uppercase tracking-[0.22em] text-[#b9cfe0]" : "text-[10px] font-bold uppercase tracking-[0.22em] text-[#b9cfe0]"}>
          {eyebrow}
        </p>
        <h1 className="mt-2 break-words text-3xl font-medium tracking-[-0.04em] sm:text-4xl">
          {title}
        </h1>
        <div className="mt-2 max-w-2xl text-sm leading-6 text-white/55">{description}</div>
      </div>

      <div className="flex shrink-0 flex-col gap-3 md:max-w-[48%] md:items-end">
        <div className="flex min-w-[17rem] items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white text-[#162d4a]">
            <Icon className="size-4" />
          </span>
          <div className="min-w-0">
            <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-white/40">{recordLabel}</p>
            <div className="mt-0.5 truncate text-sm font-medium">{recordValue}</div>
          </div>
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2 md:justify-end">{actions}</div>}
      </div>
    </section>
  );
}
