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
} from "@/components/ui/sidebar";

import { UserInfo } from "./user-info";
import { UserMenuContent } from "./user-menu-content";
import { useCurrentUser } from "@/hooks/use-current-user";

export function NavUser() {
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
              aria-label="Account menu"
              className="h-11 gap-2 rounded-full bg-card px-2 text-foreground sm:pr-3 [&>div:nth-child(2)]:hidden sm:[&>div:nth-child(2)]:grid"
            >
              <UserInfo user={user} showEmail />
              <ChevronsUpDown className="ml-auto size-4 text-muted-foreground" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            align="end"
            side="bottom"
            sideOffset={8}
          >
            <UserMenuContent user={user} />
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
