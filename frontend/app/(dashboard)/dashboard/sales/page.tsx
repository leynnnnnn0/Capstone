import { Suspense } from "react";

import AdminSalesPage from "@/components/admin-sales/AdminSalesPage";

export default function DashboardSalesRoute() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-muted-foreground">Loading sales report...</div>}>
      <AdminSalesPage />
    </Suspense>
  );
}
