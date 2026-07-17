"use client";

import { SidebarProvider } from "@/components/ui/sidebar";
import { AppContent } from "@/components/ui/app-content";
import { AppSidebar } from "@/components/ui/app-sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppSidebarHeader } from "@/components/ui/app-sidebar-header";
import { AppLayoutProps } from "@/types/ui";
import { RealtimeBridge } from "@/components/realtime/RealtimeBridge";

export default function AppSidebarLayout({
  children,
  breadcrumbs = [],
}: AppLayoutProps) {
  return (
    <TooltipProvider>
      <SidebarProvider>
        <AppSidebar />
        <AppContent
          variant="sidebar"
          className="admin-workspace overflow-x-hidden bg-[#f3f6f8] text-[#142235]"
        >
          <RealtimeBridge />
          <AppSidebarHeader breadcrumbs={breadcrumbs} />
          {children}
        </AppContent>
      </SidebarProvider>
    </TooltipProvider>
  );
}
