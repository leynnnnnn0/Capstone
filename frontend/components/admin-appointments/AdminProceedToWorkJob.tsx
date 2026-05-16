"use client";

import Link from "next/link";
import { BriefcaseBusiness, ExternalLink } from "lucide-react";

import { Button } from "@/components/ui/button";
import AdminAppointmentStatusBadge from "@/components/admin-appointments/AdminAppointmentStatusBadge";
import type { AdminAppointment } from "@/features/admin-appointments/types";

export default function AdminProceedToWorkJob({ appointment }: { appointment: AdminAppointment }) {
  if (appointment.work_job) {
    return (
      <div className="rounded-lg border bg-card p-5 shadow-sm">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-primary">Work Job</h2>
        <div className="mt-3 flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-foreground">{appointment.work_job.work_job_number}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {appointment.work_job.scheduled_date
                ? `${appointment.work_job.scheduled_date} · ${appointment.work_job.scheduled_time_from ?? "-"}-${appointment.work_job.scheduled_time_until ?? "-"}`
                : "Schedule pending"}
            </p>
          </div>
          <AdminAppointmentStatusBadge status={appointment.work_job.status} />
        </div>
        <Button asChild variant="outline" className="mt-4 w-full gap-2">
          <Link href={`/dashboard/work-jobs/${appointment.work_job.id}`}>
            <ExternalLink className="size-4" />
            View Work Job
          </Link>
        </Button>
      </div>
    );
  }

  if (appointment.status !== "completed") return null;

  return (
    <div className="rounded-lg border bg-card p-5 shadow-sm">
      <h2 className="text-xs font-semibold uppercase tracking-widest text-primary">Work Job</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Create a work job with this appointment&apos;s customer, location, quotation, schedule, and assigned workers prefilled.
      </p>
      <Button asChild className="mt-4 w-full gap-2">
        <Link href={`/dashboard/work-jobs/create?appointment=${appointment.id}`}>
          <BriefcaseBusiness className="size-4" />
          Create Work Job
        </Link>
      </Button>
    </div>
  );
}
