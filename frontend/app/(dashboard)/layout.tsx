import AppSidebarLayout from "@/app/layouts/app/app-sidebar-layout";
import type { AppLayoutProps } from "@/types/ui";

export default function DashboardLayout({
  children,
  breadcrumbs,
  ...props
}: AppLayoutProps) {
  return (
    <AppSidebarLayout breadcrumbs={breadcrumbs} {...props}>
      <div className="mx-auto min-w-0 w-full max-w-7xl overflow-x-hidden px-5 py-8 md:py-10 2xl:px-0">
        {children}
      </div>
    </AppSidebarLayout>
  );
}
