'use client';

import {
  CalendarDays,
  BriefcaseBusiness,
  ChartNoAxesCombined,
  Database,
  LayoutGrid,
  Package,
  ShieldCheck,
  User2Icon,
  WalletCards,
} from "lucide-react";
import { NavMain } from "./nav-main";
import { can } from "@/features/auth/current-user-api";
import { useCurrentUser } from "@/hooks/use-current-user";
import {
  Sidebar,
  SidebarContent,
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
    title: "Overview",
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
];

const systemNavItems: NavItem[] = [
  {
    title: "Audit Log",
    href: "/dashboard/audits",
    icon: ShieldCheck,
    permission: "audits.view",
  },
  {
    title: "Database",
    href: "/dashboard/database",
    icon: Database,
    permission: "database.manage",
  },
];

export function AppSidebar() {
  const { user } = useCurrentUser();
  const visibleItems = mainNavItems.filter((item) => !item.permission || can(user, item.permission));
  const visibleSystemItems = systemNavItems.filter((item) => !item.permission || can(user, item.permission));

  return (
    <Sidebar
      collapsible="icon"
      variant="floating"
      className="staff-rail"
    >
      <SidebarHeader className="h-16 justify-center px-3 group-data-[collapsible=icon]:items-center">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild className="h-auto gap-2 p-0 text-foreground hover:bg-transparent data-[active=true]:bg-transparent">
              <Link href="/dashboard" aria-label="SOG Workspace overview" prefetch>
                <span className="flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-secondary p-1">
                  <Image src="/images/sog-logo.png" width={32} height={32} alt="SOG logo" />
                </span>
                <span className="min-w-0 leading-tight group-data-[collapsible=icon]:hidden">
                  <span className="block truncate text-[15px] font-semibold">SOG Workspace</span>
                  <span className="mt-0.5 block truncate text-xs text-muted-foreground">Glass &amp; Aluminum</span>
                </span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent className="pb-3">
        <NavMain label="Administration" items={visibleItems} />
        {visibleSystemItems.length > 0 && <NavMain label="System" items={visibleSystemItems} />}
      </SidebarContent>

    </Sidebar>
  );
}
