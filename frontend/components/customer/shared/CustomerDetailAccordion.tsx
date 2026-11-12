"use client";

import { customerRecordWaveClass } from "@/components/customer/shared/customer-surfaces";
import { useState, type ReactNode } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

export default function CustomerDetailAccordion({
  title,
  children,
  defaultOpen = false,
}: {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`flex w-full items-center justify-between gap-3 rounded-lg border bg-white p-5 text-left transition-colors hover:bg-[#f7f9fa] ${customerRecordWaveClass}`}
        aria-expanded="false"
      >
        <span className="text-xs font-semibold uppercase tracking-widest text-[#2d425b]">{title}</span>
        <ChevronDown className="size-4 shrink-0 text-[#2d425b]" />
      </button>
    );
  }

  return (
    <section className="relative min-w-0">
      {children}
      <button
        type="button"
        onClick={() => setOpen(false)}
        className="absolute right-0 -top-2 z-20 flex size-7 items-center justify-center rounded-full border bg-white text-[#2d425b] shadow-sm transition-colors hover:bg-[#f3f6f8]"
        aria-expanded="true"
        aria-label={`Collapse ${title}`}
      >
        <ChevronUp className="size-4" />
      </button>
    </section>
  );
}
