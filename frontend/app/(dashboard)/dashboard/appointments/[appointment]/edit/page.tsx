import { Suspense } from "react";

import AdminAppointmentForm from "@/components/admin-appointments/AdminAppointmentForm";

export default async function DashboardAppointmentEditRoute({
  params,
}: {
  params: Promise<{ appointment: string }>;
}) {
  const { appointment } = await params;

  return (
    <Suspense fallback={<p className="text-sm text-muted-foreground">Loading appointment form...</p>}>
      <AdminAppointmentForm appointmentId={appointment} />
    </Suspense>
  );
}
