"use client";

import Link from "next/link";
import { BriefcaseBusiness, ExternalLink, Pencil } from "lucide-react";

import AdminWorkJobStatusBadge from "@/components/admin-work-jobs/AdminWorkJobStatusBadge";
import { AdminPageHeader } from "@/components/ui/admin-page-header";
import { Button } from "@/components/ui/button";
import type { AdminWorkJob } from "@/features/admin-work-jobs/types";

export default function AdminWorkJobHeader({ workJob }: { workJob: AdminWorkJob }) {
  const canEdit = !["cancelled", "no_show"].includes(workJob.status);

  return (
    <AdminPageHeader
      backHref="/dashboard/work-jobs"
      backLabel="Back to work jobs"
      eyebrow="Operations scheduling"
      title={workJob.full_name}
      description="Review the job schedule, assigned team, fabrication progress, charges, and payments."
      icon={BriefcaseBusiness}
      recordLabel="Work job record"
      recordValue={workJob.work_job_number}
      actions={(
        <>
          <AdminWorkJobStatusBadge status={workJob.status} />
          {workJob.appointment_id && (
            <Button asChild variant="outline" size="sm" className="gap-1.5 border-white/15 bg-white/[0.06] text-white hover:bg-white/10 hover:text-white">
              <Link href={`/dashboard/appointments/${workJob.appointment_id}`}>
                From appointment
                <ExternalLink className="size-3" />
              </Link>
            </Button>
          )}
          {canEdit && (
            <Button asChild variant="outline" size="sm" className="gap-1.5 border-white/15 bg-white/[0.06] text-white hover:bg-white/10 hover:text-white">
              <Link href={`/dashboard/work-jobs/${workJob.id}/edit`}>
                <Pencil className="size-3.5" />
                Edit
              </Link>
            </Button>
          )}
        </>
      )}
    />
  );
}
