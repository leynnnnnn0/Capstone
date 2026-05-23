"use client";

import Link from "next/link";
import { GitBranch } from "lucide-react";

import CustomerStatusBadge from "@/components/customer/shared/CustomerStatusBadge";
import { Button } from "@/components/ui/button";
import { formatCustomerSchedule } from "@/features/customer/customer-utils";
import type { CustomerBackJobSummary, CustomerWorkJob } from "@/features/customer/types";

export default function CustomerWorkJobBackJobsCard({ workJob }: { workJob: CustomerWorkJob }) {
  const hasParent = Boolean(workJob.parent_work_job);
  const backJobs = workJob.back_jobs ?? [];

  if (!hasParent && backJobs.length === 0) return null;

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-2">
        <GitBranch className="size-4 text-primary" />
        <h2 className="text-xs font-semibold uppercase tracking-widest text-primary">
          Back Job Updates
        </h2>
      </div>

      {workJob.parent_work_job && (
        <div className="mt-4 rounded-lg border border-blue-100 bg-blue-50/70 p-3">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-primary">
            Created From
          </p>
          <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium text-slate-950">
                {workJob.parent_work_job.work_job_number}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {workJob.back_job_reason_label ?? "Back job"} ·{" "}
                {workJob.back_job_details ?? "Return visit scheduled."}
              </p>
            </div>
            <Button asChild type="button" variant="outline" size="sm">
              <Link href={`/account/work-jobs/${workJob.parent_work_job.id}`}>View Source</Link>
            </Button>
          </div>
        </div>
      )}

      {backJobs.length > 0 && (
        <div className="mt-4 space-y-3">
          {backJobs.map((backJob) => (
            <CustomerBackJobRow key={backJob.id} backJob={backJob} />
          ))}
        </div>
      )}
    </section>
  );
}

function CustomerBackJobRow({ backJob }: { backJob: CustomerBackJobSummary }) {
  return (
    <div className="rounded-lg border border-slate-200 p-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-950">{backJob.work_job_number}</p>
          <p className="mt-1 text-xs text-slate-500">
            {formatCustomerSchedule(
              backJob.scheduled_date,
              backJob.scheduled_time_from,
              backJob.scheduled_time_until,
            )}
          </p>
        </div>
        <CustomerStatusBadge status={backJob.status} />
      </div>
      <p className="mt-3 rounded-md bg-slate-50 px-3 py-2 text-xs leading-relaxed text-slate-600">
        <span className="font-medium text-slate-950">
          {backJob.back_job_reason_label ?? "Back job"}
        </span>
        {backJob.back_job_details ? ` · ${backJob.back_job_details}` : null}
      </p>
      <Button asChild type="button" variant="outline" size="sm" className="mt-3">
        <Link href={`/account/work-jobs/${backJob.id}`}>View Back Job</Link>
      </Button>
    </div>
  );
}
