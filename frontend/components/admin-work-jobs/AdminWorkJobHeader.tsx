"use client";

import Link from "next/link";
import { ArrowLeft, ExternalLink } from "lucide-react";

import AdminWorkJobStatusBadge from "@/components/admin-work-jobs/AdminWorkJobStatusBadge";
import { Button } from "@/components/ui/button";
import type { AdminWorkJob } from "@/features/admin-work-jobs/types";

export default function AdminWorkJobHeader({ workJob }: { workJob: AdminWorkJob }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-primary">{workJob.work_job_number}</p>
        <h1 className="mt-1 text-2xl font-bold text-foreground">{workJob.full_name}</h1>
        {workJob.appointment_id && (
          <Button asChild variant="link" className="h-auto p-0 text-xs font-semibold">
            <Link href={`/dashboard/appointments/${workJob.appointment_id}`}>
              From appointment
              <ExternalLink className="size-3" />
            </Link>
          </Button>
        )}
      </div>
      <div className="flex items-center gap-2">
        <AdminWorkJobStatusBadge status={workJob.status} />
        <Button asChild variant="outline" size="sm" className="gap-1.5">
          <Link href="/dashboard/work-jobs">
            <ArrowLeft className="size-3.5" />
            Back
          </Link>
        </Button>
      </div>
    </div>
  );
}
