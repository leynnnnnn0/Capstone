import { SidebarTrigger } from "@/components/ui/sidebar";
import type { BreadcrumbItem as BreadcrumbItemType } from "@/types/navigation";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { NotificationBell } from "@/components/notifications/NotificationBell";

export function AppSidebarHeader({
  breadcrumbs = [],
}: {
  breadcrumbs?: BreadcrumbItemType[];
}) {
  return (
    <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center justify-between gap-2 border-b border-[#dce4ea]/80 bg-white/85 px-4 backdrop-blur-xl transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-14 sm:px-6 lg:px-8">
      <div className="flex items-center gap-2">
        <SidebarTrigger className="-ml-1 rounded-full border border-[#dce4ea] bg-white text-[#162d4a] shadow-sm hover:bg-[#edf3f7]" />
        <Breadcrumbs breadcrumbs={breadcrumbs} />
      </div>
      <NotificationBell />
    </header>
  );
}
