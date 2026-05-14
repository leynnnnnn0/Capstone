import { Suspense } from "react";

import AdminAppointmentCreatePage from "@/components/admin-appointments/AdminAppointmentCreatePage";

export default function DashboardAppointmentCreateRoute() {
  return (
    <Suspense>
      <AdminAppointmentCreatePage />
    </Suspense>
  );
}
