"use client";

import {
  useSidebar,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useCurrentUrl } from "@/hooks/use-current-url";
import type { NavItem } from "@/types/navigation";
import Link from "next/link";

export function NavMain({ label, items = [] }: { label: string; items: NavItem[] }) {
  const { setOpenMobile } = useSidebar();
  const { isCurrentUrl, isCurrentOrParentUrl } = useCurrentUrl();

  return (
    <SidebarGroup className="px-3 py-1 group-data-[collapsible=icon]:items-center">
      <SidebarGroupLabel className="mb-2 h-7 px-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
        {label}
      </SidebarGroupLabel>
      <SidebarMenu className="gap-1 group-data-[collapsible=icon]:items-center">
        {items.map((item) => (
          <SidebarMenuItem key={item.title}>
            <SidebarMenuButton
              asChild
              isActive={
                item.href === "/dashboard"
                  ? isCurrentUrl(item.href)
                  : isCurrentOrParentUrl(item.href)
              }
              tooltip={{ children: item.title }}
              className="staff-nav-link h-11 gap-3 rounded-full px-3 text-sm text-muted-foreground hover:bg-muted hover:text-foreground data-[active=true]:bg-primary data-[active=true]:text-primary-foreground [&_svg]:size-[18px]"
            >
              <Link href={item.href} aria-label={item.title} onClick={() => setOpenMobile(false)} prefetch>
                {item.icon && <item.icon />}
                <span className="group-data-[collapsible=icon]:hidden">{item.title}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}
