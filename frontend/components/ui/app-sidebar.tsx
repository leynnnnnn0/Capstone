'use client';

import type { CSSProperties } from "react";

import {
  CalendarDays,
  BriefcaseBusiness,
  ChartNoAxesCombined,
  LayoutGrid,
  Package,
  ShieldCheck,
  User2Icon,
  WalletCards,
} from "lucide-react";
import { NavMain } from "./nav-main";
import { NavUser } from "./nav-user";
import { can } from "@/features/auth/current-user-api";
import { useCurrentUser } from "@/hooks/use-current-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { NavItem } from "@/types/navigation";
import Link from "next/link";
import Image from "next/image";

const mainNavItems: NavItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutGrid,
  },
  {
    title: "Users",
    href: "/dashboard/users",
    icon: User2Icon,
    permission: "users.view",
  },
  {
    title: "Products",
    href: "/dashboard/products",
    icon: Package,
    permission: "products.view",
  },
  {
    title: "Appointments",
    href: "/dashboard/appointments",
    icon: CalendarDays,
    permission: "appointments.view",
  },
  {
    title: "Work Jobs",
    href: "/dashboard/work-jobs",
    icon: BriefcaseBusiness,
    permission: "work-jobs.view",
  },
  {
    title: "Payments",
    href: "/dashboard/payments",
    icon: WalletCards,
    permission: "payments.view",
  },
  {
    title: "Sales",
    href: "/dashboard/sales",
    icon: ChartNoAxesCombined,
    permission: "reports.view",
  },
  {
    title: "Calendar",
    href: "/dashboard/calendar",
    icon: CalendarDays,
    permission: "calendar.view",
  },
  {
    title: "Audit Log",
    href: "/dashboard/audits",
    icon: ShieldCheck,
    permission: "audits.view",
  },
];

export function AppSidebar() {
  const { user } = useCurrentUser();
  const visibleItems = mainNavItems.filter((item) => !item.permission || can(user, item.permission));

  return (
    <Sidebar
      collapsible="icon"
      variant="inset"
      className="admin-sidebar"
      style={
        {
          "--sidebar": "#162d4a",
          "--sidebar-foreground": "#ffffff",
          "--sidebar-primary": "#ffffff",
          "--sidebar-primary-foreground": "#162d4a",
          "--sidebar-accent": "rgba(255, 255, 255, 0.1)",
          "--sidebar-accent-foreground": "#ffffff",
          "--sidebar-border": "rgba(255, 255, 255, 0.12)",
          "--sidebar-ring": "#8db3cf",
        } as CSSProperties
      }
    >
      <SidebarHeader className="bg-[#162d4a] px-3 pb-4 pt-3 text-white">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild className="h-14 px-2 hover:bg-white/10 data-[state=open]:bg-white/10">
              <Link href="/dashboard" prefetch>
                <span className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white/95 p-0.5 shadow-sm">
                  <Image src="/images/sog-logo.png" width={40} height={40} alt="SOG logo" />
                </span>
                <span className="min-w-0 leading-tight group-data-[collapsible=icon]:hidden">
                  <span className="block text-[10px] font-bold uppercase tracking-[0.18em] text-white">SOG Admin</span>
                  <span className="mt-0.5 block truncate text-[10px] font-medium text-white/45">Glass &amp; Aluminum Services</span>
                </span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent className="bg-[#162d4a] text-white">
        <NavMain items={visibleItems} />
      </SidebarContent>

      <SidebarFooter className="bg-[#162d4a] text-white">
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}
