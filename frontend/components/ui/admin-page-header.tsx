import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

type AdminPageHeaderProps = {
  title: ReactNode;
  description: ReactNode;
  backHref?: string;
  backLabel?: string;
  actions?: ReactNode;
};

export function AdminPageHeader({
  title,
  description,
  backHref,
  backLabel,
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

      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2 md:max-w-[48%] md:justify-end">{actions}</div>}
    </section>
  );
}
