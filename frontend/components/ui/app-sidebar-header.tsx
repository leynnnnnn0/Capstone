"use client";

import { SidebarTrigger } from "@/components/ui/sidebar";
import type { BreadcrumbItem as BreadcrumbItemType } from "@/types/navigation";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { usePathname } from "next/navigation";

const routeLabels: Record<string, string> = {
  dashboard: "Dashboard",
  users: "Users",
  products: "Products",
  appointments: "Appointments",
  "work-jobs": "Work Jobs",
  payments: "Payments",
  sales: "Sales",
  calendar: "Calendar",
  audits: "Audit Log",
  settings: "Settings",
};

const singularLabels: Record<string, string> = {
  users: "User",
  products: "Product",
  appointments: "Appointment",
  "work-jobs": "Work Job",
  payments: "Payment",
  audits: "Audit Record",
};

export function AppSidebarHeader({
  breadcrumbs = [],
}: {
  breadcrumbs?: BreadcrumbItemType[];
}) {
  const pathname = usePathname();
  const resolvedBreadcrumbs = breadcrumbs.length > 0
    ? breadcrumbs
    : buildBreadcrumbs(pathname);

  return (
    <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center justify-between gap-2 border-b border-[#dce4ea]/80 bg-white/85 px-4 backdrop-blur-xl transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-14 sm:px-6 lg:px-8">
      <div className="flex items-center gap-2">
        <SidebarTrigger className="-ml-1 rounded-full border border-[#dce4ea] bg-white text-[#162d4a] shadow-sm hover:bg-[#edf3f7]" />
        <div className="min-w-0 overflow-hidden">
          <Breadcrumbs breadcrumbs={resolvedBreadcrumbs} />
        </div>
      </div>
      <NotificationBell />
    </header>
  );
}

function buildBreadcrumbs(pathname: string): BreadcrumbItemType[] {
  const segments = pathname.split("/").filter(Boolean);
  if (segments[0] !== "dashboard") return [];

  if (segments.length === 1) {
    return [{ title: "Dashboard", href: "/dashboard" }];
  }

  const section = segments[1];
  const sectionLabel = routeLabels[section] ?? toTitle(section);
  const sectionHref = `/dashboard/${section}`;
  const breadcrumbs: BreadcrumbItemType[] = [
    { title: sectionLabel, href: sectionHref },
  ];

  const singular = singularLabels[section] ?? sectionLabel;
  let currentHref = sectionHref;

  segments.slice(2).forEach((segment) => {
    currentHref += `/${segment}`;

    if (segment === "create") {
      breadcrumbs.push({ title: `New ${singular}`, href: currentHref });
    } else if (segment === "edit") {
      breadcrumbs.push({ title: `Edit ${singular}`, href: currentHref });
    } else {
      breadcrumbs.push({ title: `${singular} Details`, href: currentHref });
    }
  });

  return breadcrumbs;
}

function toTitle(value: string) {
  return value
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
