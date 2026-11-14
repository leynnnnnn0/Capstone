import type { ReactNode } from "react";
import { AdminSystemAccess } from "@/components/ui/admin-system-access";

export default function DashboardDatabaseLayout({ children }: { children: ReactNode }) {
  return <AdminSystemAccess permission="database.manage">{children}</AdminSystemAccess>;
}
