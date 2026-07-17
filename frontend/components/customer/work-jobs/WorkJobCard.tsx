"use client";

import Link from "next/link";
import { ArrowUpRight, CalendarClock, MapPin } from "lucide-react";

import CustomerStatusBadge from "@/components/customer/shared/CustomerStatusBadge";
import { Badge } from "@/components/ui/badge";
import { formatCustomerSchedule } from "@/features/customer/customer-utils";
import type { CustomerWorkJob } from "@/features/customer/types";

export default function WorkJobCard({ workJob }: { workJob: CustomerWorkJob }) {
  return (
    <Link
      href={`/account/work-jobs/${workJob.id}`}
      className="group block rounded-[1.25rem] border border-[#dce4ea] bg-white p-5 transition-all hover:-translate-y-0.5 hover:border-[#b9cbd9] hover:shadow-[0_18px_50px_rgba(22,45,74,0.09)]"
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#8ca0b2]">
            {workJob.work_job_number}
          </p>
          {workJob.is_back_job && (
            <Badge variant="outline" className="mt-1 border-blue-100 bg-blue-50 text-[10px] font-medium text-primary">
              Back Job
            </Badge>
          )}
          <h3 className="mt-2 text-lg font-medium capitalize tracking-[-0.025em] text-[#101820]">
            {workJob.service_type === "other" ? workJob.service_type_other : workJob.service_type}
          </h3>
        </div>
        <CustomerStatusBadge status={workJob.status} />
      </div>

      <div className="space-y-2.5 text-sm text-[#667584]">
        <p className="flex items-center gap-2">
          <CalendarClock className="size-4 text-[#608db9]" />
          {formatCustomerSchedule(workJob.scheduled_date, workJob.scheduled_time_from, workJob.scheduled_time_until)}
        </p>
        <p className="flex items-start gap-2">
          <MapPin className="mt-0.5 size-4 shrink-0 text-[#608db9]" />
          <span className="line-clamp-2">{workJob.address}</span>
        </p>
      </div>

      <div className="mt-5 flex items-center justify-between gap-3 border-t border-[#e8edf1] pt-4 text-xs font-medium text-[#8ca0b2]">
        <span>{workJob.workers.length > 0 ? `Assigned to ${workJob.workers.map((worker) => worker.full_name).join(", ")}` : "Worker assignment pending"}</span>
        <ArrowUpRight className="size-4 shrink-0 text-[#2c5282] transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
      </div>
    </Link>
  );
}
