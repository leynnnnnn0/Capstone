"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BriefcaseBusiness, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { createWorkJobFromAppointment } from "@/features/admin-appointments/admin-appointment-api";
import type { AdminAppointment } from "@/features/admin-appointments/types";

export default function AdminProceedToWorkJob({ appointment }: { appointment: AdminAppointment }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  if (appointment.status !== "completed") return null;

  async function createWorkJob() {
    setLoading(true);
    try {
      const response = await createWorkJobFromAppointment(appointment.id) as { data?: { id?: number } };
      if (response.data?.id) router.push(`/dashboard/work-jobs/${response.data.id}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-lg border bg-card p-5 shadow-sm">
      <h2 className="text-xs font-semibold uppercase tracking-widest text-primary">Work Job</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Convert this completed appointment into a work job when the quotation is ready for production.
      </p>
      <Button type="button" className="mt-4 w-full gap-2" onClick={createWorkJob} disabled={loading}>
        {loading ? <Loader2 className="size-4 animate-spin" /> : <BriefcaseBusiness className="size-4" />}
        Proceed to Work Job
      </Button>
    </div>
  );
}
