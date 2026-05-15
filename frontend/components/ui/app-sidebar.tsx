'use client';

import {
  CalendarDays,
  BriefcaseBusiness,
  GitGraphIcon,
  LayoutGrid,
  Package,
  ShieldCheck,
  User2Icon,
} from "lucide-react";
import { NavFooter } from "@/components/ui/nav-footer";
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

const footerNavItems: NavItem[] = [
  {
    title: "Github",
    href: "https://github.com/leynnnnnn0/nextjs-laravel-auth-boilerplate.git",
    icon: GitGraphIcon,
  },
];

export function AppSidebar() {
  const { user } = useCurrentUser();
  const visibleItems = mainNavItems.filter((item) => !item.permission || can(user, item.permission));

  return (
    <Sidebar collapsible="icon" variant="inset">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/dashboard" prefetch>
                <span className="text-sm text-center font-bold">Next.js / Laravel Starter Kit</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <NavMain items={visibleItems} />
      </SidebarContent>

      <SidebarFooter>
        <NavFooter items={footerNavItems} className="mt-auto" />
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}
