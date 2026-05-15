import { Suspense } from "react";

import AdminWorkJobsPage from "@/components/admin-work-jobs/AdminWorkJobsPage";

export default function DashboardWorkJobsRoute() {
  return (
    <Suspense fallback={null}>
      <AdminWorkJobsPage />
    </Suspense>
  );
}
