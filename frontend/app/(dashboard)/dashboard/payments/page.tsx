import { Suspense } from "react";

import AdminPaymentsPage from "@/components/admin-payments/AdminPaymentsPage";

export default function DashboardPaymentsRoute() {
  return (
    <Suspense fallback={null}>
      <AdminPaymentsPage />
    </Suspense>
  );
}
