"use client";

import Link from "next/link";
import { CalendarClock, MapPin } from "lucide-react";

import CustomerStatusBadge from "@/components/customer/shared/CustomerStatusBadge";
import { formatCustomerSchedule } from "@/features/customer/customer-utils";
import type { CustomerWorkJob } from "@/features/customer/types";

export default function WorkJobCard({ workJob }: { workJob: CustomerWorkJob }) {
  return (
    <Link
      href={`/account/work-jobs/${workJob.id}`}
      className="block rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md"
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
            {workJob.work_job_number}
          </p>
          <h3 className="mt-1 text-lg font-black text-slate-950">
            {workJob.service_type === "other" ? workJob.service_type_other : workJob.service_type}
          </h3>
        </div>
        <CustomerStatusBadge status={workJob.status} />
      </div>

      <div className="space-y-2 text-sm text-slate-600">
        <p className="flex items-center gap-2">
          <CalendarClock className="size-4 text-primary" />
          {formatCustomerSchedule(workJob.scheduled_date, workJob.scheduled_time_from, workJob.scheduled_time_until)}
        </p>
        <p className="flex items-start gap-2">
          <MapPin className="mt-0.5 size-4 shrink-0 text-primary" />
          <span className="line-clamp-2">{workJob.address}</span>
        </p>
      </div>

      <div className="mt-4 border-t border-slate-100 pt-4 text-xs font-semibold text-slate-400">
        {workJob.workers.length > 0 ? `Assigned to ${workJob.workers.map((worker) => worker.full_name).join(", ")}` : "Worker assignment pending"}
      </div>
    </Link>
  );
}
