import AppSidebarLayout from "@/app/layouts/app/app-sidebar-layout";
import type { AppLayoutProps } from "@/types/ui";

export default function DashboardLayout({
  children,
  breadcrumbs,
  ...props
}: AppLayoutProps) {
  return (
    <AppSidebarLayout breadcrumbs={breadcrumbs} {...props}>
      <div className="mx-auto min-w-0 w-full max-w-[1600px] overflow-x-hidden px-4 py-5 sm:px-6 sm:py-7 lg:px-8 lg:py-8 xl:px-10">
        {children}
      </div>
    </AppSidebarLayout>
  );
}
