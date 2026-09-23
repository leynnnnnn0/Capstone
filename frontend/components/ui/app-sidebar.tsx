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
      variant="sidebar"
      className="border-r border-[#dfe6ec]"
    >
      <SidebarHeader className="h-[78px] justify-center border-b border-[#dfe6ec] px-5 py-0 group-data-[collapsible=icon]:px-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild className="h-auto gap-2 p-0 text-[#2d425b] hover:bg-transparent data-[active=true]:bg-transparent">
              <Link href="/dashboard" prefetch>
                <span className="flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-[#d8e1e8] bg-white p-0.5">
                  <Image src="/images/sog-logo.png" width={32} height={32} alt="SOG logo" />
                </span>
                <span className="min-w-0 leading-tight group-data-[collapsible=icon]:hidden">
                  <span className="block truncate text-[15px] font-semibold">SOG Admin</span>
                  <span className="mt-0.5 block truncate text-xs text-[#778ba0]">Glass &amp; Aluminum</span>
                </span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent className="py-4">
        <NavMain label="Administration" items={visibleItems} />
        {visibleSystemItems.length > 0 && <NavMain label="System" items={visibleSystemItems} />}
      </SidebarContent>

      <SidebarFooter className="border-t border-[#dfe6ec] px-5 py-4 group-data-[collapsible=icon]:px-2">
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}
