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
      <section className="rounded-[1.5rem] border border-[#dce4ea] bg-white p-5 shadow-[0_18px_60px_rgba(22,45,74,0.06)] sm:p-6">
        <div className="flex items-start gap-4">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
            <Check className="size-5" />
          </span>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#608db9]">Order Progress</p>
            <h2 className="mt-1 text-xl font-medium tracking-[-0.03em] text-[#101820]">No fabrication required</h2>
            <p className="mt-2 text-sm leading-6 text-[#667584]">
              This service can proceed directly through scheduling and field work. Follow the work-job status for the next visit.
            </p>
          </div>
        </div>
      </section>
    );
  }

  const currentIndex = fabricationStageIndex(fabrication.status);

  return (
    <section className="overflow-hidden rounded-[1.5rem] border border-[#dce4ea] bg-white shadow-[0_18px_60px_rgba(22,45,74,0.06)]">
      <div className="relative overflow-hidden bg-[#162d4a] px-5 py-6 text-white sm:px-7 sm:py-7">
        <div className="absolute -right-14 -top-20 size-52 rounded-full bg-[#608db9]/25 blur-3xl" />
        <div className="relative grid gap-5 sm:grid-cols-[1fr_auto] sm:items-end">
          <div>
            <div className="flex items-center gap-2 text-[#c8dae8]">
              <Factory className="size-4" />
              <p className="text-[10px] font-bold uppercase tracking-[0.2em]">Fabrication Progress</p>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <h2 className="text-2xl font-medium tracking-[-0.035em] sm:text-3xl">{fabrication.status_label}</h2>
              {fabrication.status === "on_hold" && (
                <Badge className="border-amber-300/30 bg-amber-300/15 text-amber-100">Needs attention</Badge>
              )}
            </div>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-white/65">{fabrication.description}</p>
          </div>
          <div className={cn(
            "rounded-2xl border px-4 py-3 sm:min-w-52",
            fabrication.is_overdue
              ? "border-amber-300/30 bg-amber-300/10"
              : "border-white/10 bg-white/8",
          )}>
            <div className="flex items-center gap-2 text-white/55">
              {fabrication.is_overdue ? <AlertTriangle className="size-3.5" /> : <Clock3 className="size-3.5" />}
              <p className="text-[9px] font-bold uppercase tracking-[0.16em]">Estimated completion</p>
            </div>
            <p className="mt-1 text-sm font-semibold text-white">{eta}</p>
            {fabrication.expected_completion_date && (
              <p className="mt-1 text-xs text-white/55">{formatCustomerDate(fabrication.expected_completion_date)}</p>
            )}
          </div>
        </div>
      </div>

      <div className="p-5 sm:p-7">
        <div className="flex items-center justify-between gap-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#608db9]">Overall fabrication</p>
          <p className="text-sm font-semibold text-[#2c5282]">{fabrication.progress_percentage}%</p>
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
            className="h-full rounded-full bg-gradient-to-r from-[#608db9] to-[#2c5282] transition-[width] duration-500"
            style={{ width: `${fabrication.progress_percentage}%` }}
          />
        </div>

        <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
          {fabricationStages.map((stage, index) => {
            const done = currentIndex > index || fabrication.status === "ready_for_installation";
            const current = currentIndex === index && fabrication.status !== "on_hold";
            const label = fabricationStatusOptions.find((option) => option.value === stage)?.label ?? stage;

            return (
              <div
                key={stage}
                className={cn(
                  "rounded-xl border px-3 py-3 transition-colors",
                  current && "border-[#608db9] bg-[#eaf2f8]",
                  done && !current && "border-emerald-100 bg-emerald-50/70",
                  !done && !current && "border-[#e3e9ee] bg-[#f8fafb]",
                )}
              >
                <span className={cn(
                  "flex size-6 items-center justify-center rounded-full text-[10px] font-bold",
                  current && "bg-[#2c5282] text-white",
                  done && !current && "bg-emerald-600 text-white",
                  !done && !current && "bg-[#e5edf3] text-[#7a8997]",
                )}>
                  {done ? <Check className="size-3.5" /> : index + 1}
                </span>
                <p className={cn(
                  "mt-2 text-[10px] font-semibold leading-4",
                  current ? "text-[#2c5282]" : done ? "text-emerald-800" : "text-[#71808d]",
                )}>
                  {shortStageLabel(label)}
                </p>
              </div>
            );
          })}
        </div>

        {fabrication.status === "on_hold" && (
          <div className="mt-5 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-800">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" />
            <p className="text-sm leading-6">Fabrication is temporarily on hold. SOG will update the estimate when work can continue.</p>
          </div>
        )}

        {fabrication.notes && (
          <div className="mt-5 rounded-xl border border-blue-100 bg-blue-50/70 px-4 py-4">
            <div className="flex items-center gap-2 text-[#2c5282]">
              <Sparkles className="size-4" />
              <p className="text-[10px] font-bold uppercase tracking-[0.18em]">Latest update from SOG</p>
            </div>
            <p className="mt-2 text-sm leading-6 text-[#445463]">{fabrication.notes}</p>
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
