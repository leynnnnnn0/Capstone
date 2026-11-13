import AppSidebarLayout from "@/app/layouts/app/app-sidebar-layout";
import type { AppLayoutProps } from "@/types/ui";

export default function DashboardLayout({
  children,
  breadcrumbs,
  ...props
}: AppLayoutProps) {
  return (
    <AppSidebarLayout breadcrumbs={breadcrumbs} {...props}>
      <div className="mx-auto min-w-0 w-full max-w-[105rem] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        {children}
      </div>
    </AppSidebarLayout>
  );
}
