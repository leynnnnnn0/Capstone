"use client";

import { SidebarProvider } from "@/components/ui/sidebar";
import { AppContent } from "@/components/ui/app-content";
import { AppSidebar } from "@/components/ui/app-sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppSidebarHeader } from "@/components/ui/app-sidebar-header";
import { AppLayoutProps } from "@/types/ui";
import { RealtimeBridge } from "@/components/realtime/RealtimeBridge";
import type { CSSProperties } from "react";

export default function AppSidebarLayout({
  children,
  breadcrumbs = [],
}: AppLayoutProps) {
  return (
    <TooltipProvider>
      <SidebarProvider style={{ "--sidebar-width": "15.625rem" } as CSSProperties}>
        <AppSidebar />
        <AppContent
          variant="sidebar"
          className="admin-workspace overflow-x-hidden"
        >
          <RealtimeBridge />
          <AppSidebarHeader breadcrumbs={breadcrumbs} />
          {children}
        </AppContent>
      </SidebarProvider>
    </TooltipProvider>
  );
}
