import type { ReactNode } from "react";

export default function CustomerPageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <section className="relative mb-6 overflow-hidden rounded-[1.75rem] bg-[#162d4a] px-5 py-8 text-white sm:mb-8 sm:px-9 sm:py-10 lg:px-12">
      <div className="absolute -right-20 -top-28 h-72 w-72 rounded-full bg-[#608db9]/25 blur-3xl" />
      <div className="relative flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-white/55 sm:text-xs">
            {eyebrow}
          </p>
          <h1 className="mt-3 text-[clamp(2.25rem,5vw,4.75rem)] font-medium leading-[0.92] tracking-[-0.05em]">
            {title}
          </h1>
          {description && (
            <p className="mt-4 max-w-2xl text-sm leading-6 text-white/60 sm:text-base">
              {description}
            </p>
          )}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
    </section>
  );
}
