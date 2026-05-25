"use client";

import { CalendarDays, Clock3, ShieldCheck, UserRoundCheck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { formatCustomerDate } from "@/features/customer/customer-utils";
import type { CustomerWorkJob, CustomerWorkJobWarrantyStatus } from "@/features/customer/types";
import { cn } from "@/lib/utils";

const warrantyStatusClass: Record<CustomerWorkJobWarrantyStatus, string> = {
  active: "border-emerald-200 bg-emerald-50 text-emerald-700",
  expired: "border-slate-200 bg-slate-100 text-slate-700",
  voided: "border-red-200 bg-red-50 text-red-700",
};

export default function WorkJobWarrantyCard({ workJob }: { workJob: CustomerWorkJob }) {
  const warranty = workJob.warranty;

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="size-4 text-primary" />
          <h2 className="text-xs font-semibold uppercase tracking-widest text-primary">
            Warranty Record
          </h2>
        </div>
        {warranty && (
          <Badge
            variant="outline"
            className={cn(
              "shrink-0 font-medium",
              warrantyStatusClass[warranty.status] ?? warrantyStatusClass.active,
            )}
          >
            {warranty.status_label}
          </Badge>
        )}
      </div>

      {warranty ? (
        <div className="mt-4 space-y-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">
              Warranty No.
            </p>
            <p className="mt-1 text-sm font-medium text-slate-950">
              {warranty.warranty_number ?? "Pending number"}
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <WarrantyInfo
              icon={CalendarDays}
              label="Starts"
              value={formatCustomerDate(warranty.starts_at)}
            />
            <WarrantyInfo
              icon={Clock3}
              label="Expires"
              value={formatCustomerDate(warranty.expires_at)}
            />
            <WarrantyInfo
              icon={ShieldCheck}
              label="Duration"
              value={`${warranty.duration_months} months`}
            />
            <WarrantyInfo
              icon={UserRoundCheck}
              label="Issued By"
              value={warranty.issued_by?.full_name ?? "SOG Glass & Aluminum"}
            />
          </div>

          {warranty.coverage && (
            <WarrantyText label="Coverage" value={warranty.coverage} />
          )}
          {warranty.terms && <WarrantyText label="Terms" value={warranty.terms} />}
          {warranty.notes && <WarrantyText label="Notes" value={warranty.notes} />}
        </div>
      ) : (
        <p className="mt-4 rounded-lg border border-dashed border-slate-200 bg-slate-50 px-3 py-3 text-xs leading-relaxed text-slate-600">
          {emptyWarrantyMessage(workJob)}
        </p>
      )}
    </section>
  );
}

function emptyWarrantyMessage(workJob: CustomerWorkJob) {
  if (workJob.is_back_job) {
    return "This back job is covered by the original work job warranty unless a separate warranty is issued by management.";
  }

  if (workJob.status === "completed") {
    return "This completed job does not have a warranty record yet.";
  }

  return "Warranty coverage starts after the work job is completed.";
}

function WarrantyInfo({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof ShieldCheck;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
      <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
        <Icon className="size-3.5 text-primary" />
        {label}
      </div>
      <p className="mt-1 text-sm font-normal text-slate-950">{value}</p>
    </div>
  );
}

function WarrantyText({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-xs leading-relaxed text-slate-600">{value}</p>
    </div>
  );
}
