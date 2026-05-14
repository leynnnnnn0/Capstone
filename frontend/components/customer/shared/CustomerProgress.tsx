import { Button } from "@/components/ui/button";
import {
  customerRemarkForAction,
  formatCustomerDate,
  formatCustomerDateTime,
  formatCustomerTime,
} from "@/features/customer/customer-utils";
import { Check, Truck } from "lucide-react";

import type { CustomerRemark, CustomerStatus } from "@/features/customer/types";
import { cn } from "@/lib/utils";

const appointmentSteps = [
  { key: "pending", label: "Booked" },
  { key: "confirmed", label: "Confirmed" },
  { key: "on_the_way", label: "On the Way" },
  { key: "in_progress", label: "In Progress" },
  { key: "completed", label: "Completed" },
];

const workJobSteps = [
  { key: "pending", label: "Pending" },
  { key: "in_progress", label: "In Progress" },
  { key: "completed", label: "Completed" },
];

export default function CustomerProgress({
  status,
  type,
  reference,
  createdAt,
  scheduledDate,
  timeFrom,
  timeUntil,
  remarks,
}: {
  status: CustomerStatus;
  type: "appointment" | "work_job";
  reference?: string;
  createdAt?: string | null;
  scheduledDate?: string | null;
  timeFrom?: string | null;
  timeUntil?: string | null;
  remarks?: CustomerRemark[];
}) {
  const steps = type === "appointment" ? appointmentSteps : workJobSteps;
  const current = Math.max(0, steps.findIndex((step) => step.key === status));

  if (status === "cancelled" || status === "no_show") {
    return (
      <div className="rounded-lg border border-red-100 bg-red-50 p-3 text-sm font-semibold text-red-700">
        This {type === "appointment" ? "appointment" : "work job"} is {status === "no_show" ? "marked no show" : "cancelled"}.
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-5 flex items-center justify-between gap-4">
        <p className="text-lg font-black text-slate-950">Job Progress</p>
        {reference && <p className="text-sm font-black text-primary">{reference}</p>}
      </div>
      <div className="relative space-y-5">
        <div className="absolute bottom-6 left-4 top-4 w-px bg-slate-200" />
        {steps.map((step, index) => {
          const done = index <= current;
          const active = index === current;
          const timestamp = stepTimestamp({
            step: step.key,
            createdAt,
            scheduledDate,
            timeFrom,
            timeUntil,
            remarks,
            done,
          });
          const remark = customerRemarkForAction(remarks, step.key);

          return (
            <div key={step.key} className="relative flex gap-4">
              <span
                className={cn(
                  "z-10 flex size-8 shrink-0 items-center justify-center rounded-full border-2 bg-white text-xs font-bold",
                  done && !active ? "border-emerald-600 bg-emerald-600 text-white" : "",
                  active ? "border-primary bg-white text-primary ring-4 ring-primary/10" : "",
                  !done ? "border-slate-200 bg-slate-100 text-slate-400" : "",
                )}
              >
                {done && !active ? <Check className="size-4" /> : step.key === "on_the_way" && active ? <Truck className="size-4" /> : <Check className="size-4" />}
              </span>
              <div className="min-w-0 pb-1">
                <p className={cn("text-sm font-black", done ? "text-slate-950" : "text-slate-500")}>
                  {step.label}
                </p>
                <p className={cn("mt-0.5 text-xs font-semibold", active ? "text-primary" : "text-slate-500")}>
                  {timestamp}
                </p>
                {remark?.message && active && (
                  <p className="mt-1 text-xs leading-relaxed text-slate-500">{remark.message}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <Button type="button" variant="outline" className="mt-4 h-10 w-full border-primary/30 text-primary hover:bg-primary/5">
        View Full Timeline
      </Button>
    </div>
  );
}

function stepTimestamp({
  step,
  createdAt,
  scheduledDate,
  timeFrom,
  timeUntil,
  remarks,
  done,
}: {
  step: string;
  createdAt?: string | null;
  scheduledDate?: string | null;
  timeFrom?: string | null;
  timeUntil?: string | null;
  remarks?: CustomerRemark[];
  done: boolean;
}) {
  if (step === "pending") return formatCustomerDateTime(createdAt);

  const remark = customerRemarkForAction(remarks, step);
  if (remark?.created_at) return formatCustomerDateTime(remark.created_at);

  if ((step === "confirmed" || step === "on_the_way") && scheduledDate) {
    const time = timeFrom ? ` · ${formatCustomerTime(timeFrom)}` : "";
    return `${formatCustomerDate(scheduledDate)}${time}`;
  }

  if (timeFrom && timeUntil && done) {
    return `${formatCustomerTime(timeFrom)} - ${formatCustomerTime(timeUntil)}`;
  }

  return done ? "Updated" : "Pending";
}
