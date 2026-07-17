"use client";

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useCurrentUrl } from "@/hooks/use-current-url";
import type { NavItem } from "@/types/navigation";
import Link from "next/link";

export function NavMain({ items = [] }: { items: NavItem[] }) {
  const { isCurrentUrl, isCurrentOrParentUrl } = useCurrentUrl();

  return (
    <SidebarGroup className="px-3 py-0">
      <SidebarGroupLabel className="mb-2 px-2 text-[9px] font-bold uppercase tracking-[0.22em] text-white/35">
        Workspace
      </SidebarGroupLabel>
      <SidebarMenu className="gap-1.5">
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
              className="h-10 rounded-xl px-3 text-white/80 transition-all hover:bg-white/12 hover:text-white focus-visible:bg-white/12 focus-visible:text-white data-[active=true]:bg-white data-[active=true]:font-semibold data-[active=true]:text-[#162d4a] data-[active=true]:shadow-[0_8px_28px_rgba(0,0,0,0.16)]"
            >
              <Link href={item.href} prefetch>
                {item.icon && <item.icon />}
                <span>{item.title}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}
