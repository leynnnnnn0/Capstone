import { Suspense } from "react";

import AdminSalesPage from "@/components/admin-sales/AdminSalesPage";
import { AdminDashboardSkeleton } from "@/components/dashboard/AdminDashboardPage";

export default function DashboardSalesRoute() {
  return (
    <Suspense fallback={<AdminDashboardSkeleton />}>
      <AdminSalesPage />
    </Suspense>
  );
}
