import AppSidebarLayout from "@/app/layouts/app/app-sidebar-layout";
import type { AppLayoutProps } from "@/types/ui";

export default function DashboardLayout({
  children,
  breadcrumbs,
  ...props
}: AppLayoutProps) {
  return (
    <AppSidebarLayout breadcrumbs={breadcrumbs} {...props}>
      <div className="min-w-0 max-w-full overflow-x-hidden p-4 sm:p-5 lg:p-6">{children}</div>
    </AppSidebarLayout>
  );
}
