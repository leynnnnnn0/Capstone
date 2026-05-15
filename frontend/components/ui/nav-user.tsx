"use client";

import { ChevronsUpDown } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

import { UserInfo } from "./user-info";
import { UserMenuContent } from "./user-menu-content";
import { useIsMobile } from "@/hooks/use-mobile";
import { useCurrentUser } from "@/hooks/use-current-user";

export function NavUser() {
  const { state } = useSidebar();
  const isMobile = useIsMobile();
  const { user: currentUser } = useCurrentUser();
  const user = {
    ...currentUser,
    id: currentUser?.id ?? 0,
    name: currentUser?.full_name ?? currentUser?.name ?? "Staff User",
    email: currentUser?.email ?? "",
    avatar: "",
    email_verified_at: currentUser?.email_verified_at ?? null,
    created_at: currentUser?.created_at ?? "",
    updated_at: currentUser?.updated_at ?? "",
  };

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="group text-sidebar-accent-foreground data-[state=open]:bg-sidebar-accent"
            >
              <UserInfo user={user} />
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            align="end"
            side={
              isMobile ? "bottom" : state === "collapsed" ? "left" : "bottom"
            }
          >
            <UserMenuContent user={user} />
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
