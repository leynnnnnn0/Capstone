"use client";

import { AlertTriangle, CalendarDays, Check, Clock3, Factory, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  fabricationEtaLabel,
  fabricationStageIndex,
  fabricationStages,
  fabricationStatusOptions,
} from "@/features/customer/fabrication";
import { formatCustomerDate, formatCustomerDateTime } from "@/features/customer/customer-utils";
import type { CustomerWorkJob } from "@/features/customer/types";
import { cn } from "@/lib/utils";

export default function CustomerFabricationProgressCard({ workJob }: { workJob: CustomerWorkJob }) {
  const fabrication = workJob.fabrication;
  const eta = fabricationEtaLabel(fabrication);

  if (fabrication.status === "not_required") {
    return (
      <section className="rounded-lg border bg-card p-5 shadow-sm">
        <div className="flex items-start gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
            <Check className="size-4" />
          </span>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8194a7]">Fabrication progress</p>
            <h2 className="mt-2 text-base font-semibold text-[#2d425b]">No fabrication required</h2>
            <p className="mt-2 text-sm leading-6 text-[#71869c]">
              This service can proceed directly through scheduling and field work. Follow the work-job status for the next visit.
            </p>
          </div>
        </div>
      </section>
    );
  }

  const currentIndex = fabricationStageIndex(fabrication.status);

  return (
    <section className="rounded-lg border bg-card p-5 shadow-sm">
      <div>
        <div className="space-y-4">
          <div>
            <div className="flex items-center gap-2 text-[#64879a]">
              <Factory className="size-4" />
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em]">Fabrication progress</p>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <h2 className="text-base font-semibold text-[#2d425b]">{fabrication.status_label}</h2>
              {fabrication.status === "on_hold" && (
                <Badge className="border-transparent bg-amber-500 text-white">
                  <span aria-hidden="true" className="size-1.5 rounded-full bg-white/85" />
                  Needs attention
                </Badge>
              )}
            </div>
            <p className="mt-2 text-sm leading-6 text-[#71869c]">{fabrication.description}</p>
          </div>
          <div className={cn(
            "rounded-lg border px-3 py-3",
            fabrication.is_overdue
              ? "border-amber-200 bg-amber-50"
              : "border-[#dce4ea] bg-[#f7f9fa]",
          )}>
            <div className="flex items-center gap-2 text-[#8194a7]">
              {fabrication.is_overdue ? <AlertTriangle className="size-3.5" /> : <Clock3 className="size-3.5" />}
              <p className="text-xs text-muted-foreground">Estimated completion</p>
            </div>
            <p className="mt-1 text-sm font-semibold text-[#2d425b]">{eta}</p>
            {fabrication.expected_completion_date && (
              <p className="mt-1 text-xs text-[#71869c]">{formatCustomerDate(fabrication.expected_completion_date)}</p>
            )}
          </div>
        </div>
      </div>

      <div className="mt-5 border-t border-[#e5ebef] pt-5">
        <div className="flex items-center justify-between gap-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8194a7]">Overall fabrication</p>
          <p className="text-sm font-semibold text-[#2d425b]">{fabrication.progress_percentage}%</p>
        </div>
        <div
          className="mt-2 h-2.5 overflow-hidden rounded-full bg-[#e5edf3]"
          role="progressbar"
          aria-label="Fabrication progress"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={fabrication.progress_percentage}
        >
          <div
            className="h-full rounded-full bg-[#2d425b] transition-[width] duration-500"
            style={{ width: `${fabrication.progress_percentage}%` }}
          />
        </div>

        <div className="mt-5 space-y-1.5">
          {fabricationStages.map((stage, index) => {
            const done = currentIndex > index || fabrication.status === "ready_for_installation";
            const current = currentIndex === index && fabrication.status !== "on_hold";
            const label = fabricationStatusOptions.find((option) => option.value === stage)?.label ?? stage;

            return (
              <div
                key={stage}
                className={cn(
                  "flex items-center gap-3 rounded-lg border px-3 py-2.5 transition-colors",
                  current && "border-[#9db2c0] bg-[#eef4f7]",
                  done && !current && "border-emerald-100 bg-emerald-50/70",
                  !done && !current && "border-[#e3e9ee] bg-[#f8fafb]",
                )}
              >
                <span className={cn(
                  "flex size-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold",
                  current && "bg-[#2d425b] text-white",
                  done && !current && "bg-emerald-600 text-white",
                  !done && !current && "bg-[#e5edf3] text-[#7a8997]",
                )}>
                  {done ? <Check className="size-3.5" /> : index + 1}
                </span>
                <p className={cn(
                  "text-xs font-medium leading-4",
                  current ? "text-[#2d425b]" : done ? "text-emerald-800" : "text-[#71808d]",
                )}>
                  {shortStageLabel(label)}
                </p>
              </div>
            );
          })}
        </div>

        {fabrication.status === "on_hold" && (
          <div className="mt-5 flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-amber-800">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" />
            <p className="text-sm leading-6">Fabrication is temporarily on hold. SOG will update the estimate when work can continue.</p>
          </div>
        )}

        {fabrication.notes && (
          <div className="mt-5 rounded-lg border border-[#dce4ea] bg-[#f7f9fa] px-4 py-4">
            <div className="flex items-center gap-2 text-[#64879a]">
              <Sparkles className="size-4" />
              <p className="text-[10px] font-bold uppercase tracking-[0.18em]">Latest update from SOG</p>
            </div>
            <p className="mt-2 text-sm leading-6 text-[#496078]">{fabrication.notes}</p>
          </div>
        )}

        <div className="mt-5 flex flex-col gap-2 border-t border-[#edf1f4] pt-4 text-xs text-[#7a8997] sm:flex-row sm:items-center sm:justify-between">
          <span className="flex items-center gap-1.5">
            <CalendarDays className="size-3.5" />
            Target: {formatCustomerDate(fabrication.expected_completion_date)}
          </span>
            <span>
              {fabrication.updated_at
                ? `Last updated ${formatCustomerDateTime(fabrication.updated_at)}`
                : "Awaiting the first SOG update"}
            </span>
        </div>
      </div>
    </section>
  );
}

function shortStageLabel(label: string) {
  return label
    .replace("Fabrication Planning", "Planning")
    .replace("Queued for Fabrication", "Queued")
    .replace("Fabrication in Progress", "Fabricating")
    .replace("Ready for Installation", "Ready");
}
