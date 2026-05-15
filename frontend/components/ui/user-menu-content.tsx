"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut, Settings } from "lucide-react";
import { api } from "@/lib/api";

import {
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

import { UserInfo } from "./user-info";
import { useMobileNavigation } from "@/hooks/use-mobile-navigation";
import type { User } from "@/types/user";

type Props = {
  user: User;
};

export function UserMenuContent({ user }: Props) {
  const cleanup = useMobileNavigation();
  const router = useRouter();

  const handleLogout = async () => {
    cleanup();

    await api("/api/logout", {
      method: "POST",
    });

    router.push("/login");
  };

  return (
    <>
      <DropdownMenuLabel className="p-0 font-normal">
        <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
          <UserInfo user={user} showEmail />
        </div>
      </DropdownMenuLabel>

      <DropdownMenuSeparator />

      <DropdownMenuGroup>
        <DropdownMenuItem asChild>
          <Link
            href="/dashboard/settings"
            className="block w-full cursor-pointer"
            onClick={cleanup}
          >
            <Settings className="mr-2" />
            Settings
          </Link>
        </DropdownMenuItem>
      </DropdownMenuGroup>

      <DropdownMenuSeparator />

      <DropdownMenuItem onClick={handleLogout}>
        <LogOut className="mr-2" />
        Log out
      </DropdownMenuItem>
    </>
  );
}
