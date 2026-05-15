import { Suspense } from "react";

import AdminAppointmentsPage from "@/components/admin-appointments/AdminAppointmentsPage";

export default function DashboardAppointmentsRoute() {
  return (
    <Suspense fallback={null}>
      <AdminAppointmentsPage />
    </Suspense>
  );
}
