import type { ComponentProps, ComponentType } from "react";

type SummaryProps = ComponentProps<"article"> & {
  label: string;
  value: number | string;
  icon: ComponentType<{ className?: string }>;
  tone?: "blue" | "mist" | "light" | "slate";
  eyebrow?: string;
  description?: string;
};

export type SummaryTone = NonNullable<SummaryProps["tone"]>;

export default function AdminSummaryCard({
  label,
  value,
  icon: Icon,
  tone,
  eyebrow,
  description,
  className,
  ...props
}: SummaryProps) {
  return (
    <article {...props} className={className ? `staff-summary ${className}` : "staff-summary"} data-featured={tone === "blue"}>
      <div className="min-w-0">
        {eyebrow && <p className="staff-summary-description text-xs">{eyebrow}</p>}
        <h2 className="break-words text-sm font-medium leading-tight">{label}</h2>
      </div>
      <div className="staff-summary-value mt-auto flex min-w-0 items-center justify-between gap-2">
        <p className="min-w-0 break-words text-xl font-semibold leading-tight tracking-tight tabular-nums sm:text-3xl">{value}</p>
        <span className="staff-summary-icon size-7 shrink-0 sm:size-8">
          <Icon className="size-4" />
        </span>
      </div>
      {description && <p className="staff-summary-description text-xs leading-snug">{description}</p>}
    </article>
  );
}
