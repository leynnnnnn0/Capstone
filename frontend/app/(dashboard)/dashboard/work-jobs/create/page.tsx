import { Suspense } from "react";

import AdminWorkJobForm from "@/components/admin-work-jobs/AdminWorkJobForm";

export default function DashboardWorkJobCreateRoute() {
  return (
    <Suspense fallback={null}>
      <AdminWorkJobForm />
    </Suspense>
  );
}
