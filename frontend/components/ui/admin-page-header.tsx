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
    <section data-slot="admin-page-header" className="flex flex-col gap-5 py-1 md:flex-row md:items-end md:justify-between">
      <div className="min-w-0">
        {backHref && backLabel && (
          <Link
            href={backHref}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-3.5" />
            {backLabel}
          </Link>
        )}
        <h1 className={backHref ? "mt-5 break-words text-2xl font-semibold tracking-tight" : "break-words text-2xl font-semibold tracking-tight"}>
          {title}
        </h1>
        <div className="mt-1 max-w-2xl text-sm text-muted-foreground">{description}</div>
      </div>

      <div className="flex shrink-0 flex-col gap-3 md:max-w-[48%] md:items-end">
        <div className="hidden min-w-[17rem] items-center gap-3 border-l pl-4 md:flex">
          <span className="flex size-8 shrink-0 items-center justify-center text-muted-foreground">
            <Icon className="size-4" />
          </span>
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">{recordLabel}</p>
            <div className="mt-0.5 truncate text-sm font-medium">{recordValue}</div>
          </div>
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2 md:justify-end">{actions}</div>}
      </div>
    </section>
  );
}
