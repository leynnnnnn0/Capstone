import {
  CalendarDays,
  Clock,
  FileText,
  Mail,
  Phone,
  User,
  Wrench,
} from "lucide-react";
import type { ComponentType, ReactNode } from "react";

import {
  formatWorkJobDate,
  formatWorkJobTime,
} from "@/features/admin-work-jobs/admin-work-job-utils";
import type { AdminWorkJob } from "@/features/admin-work-jobs/types";

export default function AdminWorkJobDetailsCard({ workJob }: { workJob: AdminWorkJob }) {
  return (
    <div className="rounded-lg border bg-card p-5 shadow-sm">
      <h2 className="mb-5 text-xs font-semibold uppercase tracking-widest text-primary">Work Job Details</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <Detail icon={User} label="Customer">{workJob.full_name}</Detail>
        <Detail icon={Phone} label="Phone">{workJob.phone_number}</Detail>
        <Detail icon={Mail} label="Email">{workJob.email || "-"}</Detail>
        <Detail icon={Wrench} label="Service Type">
          <span className="capitalize">{workJob.service_type}</span>
          {workJob.service_type_other && <span className="ml-1 text-muted-foreground">({workJob.service_type_other})</span>}
        </Detail>
        <Detail icon={CalendarDays} label="Scheduled Date">{formatWorkJobDate(workJob.scheduled_date)}</Detail>
        <Detail icon={Clock} label="Scheduled Time">
          {formatWorkJobTime(workJob.scheduled_time_from)} - {formatWorkJobTime(workJob.scheduled_time_until)}
        </Detail>
        {workJob.notes && (
          <div className="sm:col-span-2">
            <Detail icon={FileText} label="Notes">{workJob.notes}</Detail>
          </div>
        )}
      </div>
    </div>
  );
}

function Detail({ icon: Icon, label, children }: { icon: ComponentType<{ className?: string }>; label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        <Icon className="size-3.5" /> {label}
      </div>
      <p className="text-sm text-foreground">{children}</p>
    </div>
  );
}
