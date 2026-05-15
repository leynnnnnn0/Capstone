"use client";

import { SidebarProvider } from "@/components/ui/sidebar";
import { AppContent } from "@/components/ui/app-content";
import { AppSidebar } from "@/components/ui/app-sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { type ReactNode } from "react";
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
        <AppContent variant="sidebar" className="overflow-x-hidden">
          <RealtimeBridge />
          <AppSidebarHeader breadcrumbs={breadcrumbs} />
          {children}
        </AppContent>
      </SidebarProvider>
    </TooltipProvider>
  );
}
