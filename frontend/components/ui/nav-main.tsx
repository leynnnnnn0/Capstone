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

export function NavMain({ label, items = [] }: { label: string; items: NavItem[] }) {
  const { isCurrentUrl, isCurrentOrParentUrl } = useCurrentUrl();

  return (
    <SidebarGroup className="px-3 py-2">
      <SidebarGroupLabel className="mb-2 h-7 px-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#7b8fa3]">
        {label}
      </SidebarGroupLabel>
      <SidebarMenu className="gap-1">
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
              className="h-10 gap-2 rounded-md border-l-2 border-transparent px-3 text-[15px] font-normal text-[#71869c] hover:bg-[#f2f6f8] hover:text-[#2d425b] data-[active=true]:rounded-l-none data-[active=true]:rounded-r-lg data-[active=true]:border-[#6f95a7] data-[active=true]:bg-[#eef4f7] data-[active=true]:font-semibold data-[active=true]:text-[#2d425b] [&_svg]:size-[18px]"
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
