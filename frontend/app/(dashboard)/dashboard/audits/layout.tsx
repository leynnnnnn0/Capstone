import type { ReactNode } from "react";
import { AdminSystemAccess } from "@/components/ui/admin-system-access";

export default function DashboardAuditsLayout({ children }: { children: ReactNode }) {
  return <AdminSystemAccess permission="audits.view">{children}</AdminSystemAccess>;
}
