"use client";

import Link from "next/link";
import { BriefcaseBusiness } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { AdminAppointment } from "@/features/admin-appointments/types";

export default function AdminProceedToWorkJob({ appointment }: { appointment: AdminAppointment }) {
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
