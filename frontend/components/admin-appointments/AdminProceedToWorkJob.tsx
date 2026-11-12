import Link from "next/link";
import { BriefcaseBusiness, ExternalLink } from "lucide-react";

import { Button } from "@/components/ui/button";
import { CustomerStatus } from "@/features/customer/status";
import type { AdminAppointment } from "@/features/admin-appointments/types";

export default function AdminProceedToWorkJob({ appointment }: { appointment: AdminAppointment }) {
  if (appointment.work_job) {
    return (
      <Button asChild variant="outline" size="sm">
        <Link href={`/dashboard/work-jobs/${appointment.work_job.id}`}>
          <ExternalLink className="size-4" />
          View Work Job
        </Link>
      </Button>
    );
  }

  if (appointment.status !== CustomerStatus.Completed) return null;

  return (
    <Button asChild size="sm">
      <Link href={`/dashboard/work-jobs/create?appointment=${appointment.id}`}>
        <BriefcaseBusiness className="size-4" />
        Create Work Job
      </Link>
    </Button>
  );
}
