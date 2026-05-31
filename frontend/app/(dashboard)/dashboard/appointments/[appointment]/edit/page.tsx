import { Suspense } from "react";

import AdminAppointmentForm from "@/components/admin-appointments/AdminAppointmentForm";
import { FormPageSkeleton } from "@/components/ui/page-skeletons";

export default async function DashboardAppointmentEditRoute({
  params,
}: {
  params: Promise<{ appointment: string }>;
}) {
  const { appointment } = await params;

  return (
    <Suspense fallback={<FormPageSkeleton />}>
      <AdminAppointmentForm appointmentId={appointment} />
    </Suspense>
  );
}
