"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BriefcaseBusiness,
  ChevronDown,
  LayoutDashboard,
  CalendarDays,
  LogOut,
  UserRound,
} from "lucide-react";

import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useCurrentUser } from "@/hooks/use-current-user";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const navItems = [
  { href: "/account", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/account/appointments", label: "Appointments", icon: CalendarDays },
  { href: "/account/work-jobs", label: "Work Jobs", icon: BriefcaseBusiness },
];

export default function CustomerNavbar() {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useCurrentUser();
  const displayName = user?.full_name ?? user?.first_name ?? "Customer";
  const initials = displayName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  async function logout() {
    await api("/api/logout", { method: "POST" });
    router.push("/login");
  }

  return (
    <>
      <header className="sticky top-0 z-40 bg-[#f3f6f8]/95 px-2 pt-2 backdrop-blur-xl sm:px-3 sm:pt-3">
        <div className="mx-auto w-full max-w-[1440px] overflow-hidden rounded-[1.25rem] border border-[#dce4ea] bg-white shadow-[0_12px_40px_rgba(22,45,74,0.06)]">
        <div className="flex h-[4.5rem] items-center gap-5 px-4 sm:px-6 lg:px-8">
        <Link href="/account" className="flex shrink-0 items-center gap-3">
          <Image
            src="/images/sog-logo.png"
            alt="SOG Glass & Aluminum"
            width={1408}
            height={768}
            className="h-11 w-auto"
            priority
          />
          <span className="hidden text-[9px] font-bold uppercase leading-[1.45] tracking-[0.16em] text-[#26384a] sm:block">
            Glass &amp; Aluminum
            <br />
            Customer Portal
          </span>
        </Link>

        <nav className="ml-6 hidden items-center gap-1 rounded-full bg-[#f3f6f8] p-1 lg:flex">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = item.exact
              ? pathname === item.href
              : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2 rounded-full px-4 py-2.5 text-xs font-semibold text-[#667584] transition-all hover:text-[#162d4a]",
                  active && "bg-[#162d4a] text-white shadow-sm hover:text-white",
                )}
              >
                <Icon className="size-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          <NotificationBell className="hidden rounded-full text-[#536372] hover:bg-[#f3f6f8] sm:inline-flex" />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="flex items-center gap-2 rounded-full border border-[#dce4ea] p-1 pr-2 text-left transition-colors hover:border-[#b9cbd9] hover:bg-[#f8fafb] sm:pr-3"
              >
                <span className="flex size-9 items-center justify-center rounded-full bg-[#eaf2f8] text-xs font-bold text-[#2c5282]">
                  {initials || "CU"}
                </span>
                <span className="hidden max-w-36 truncate text-xs font-semibold text-[#26384a] sm:inline">
                  {displayName}
                </span>
                <ChevronDown className="hidden size-3.5 text-slate-500 sm:inline" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Customer account</DropdownMenuLabel>
              <DropdownMenuItem asChild className="cursor-pointer px-2 py-2">
                <Link href="/account">
                  <UserRound className="size-4" />
                  Dashboard
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                className="cursor-pointer px-2 py-2"
                onClick={logout}
              >
                <LogOut className="size-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        </div>
        </div>
      </header>

      <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-[#dce4ea] bg-white/95 px-3 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 shadow-[0_-14px_38px_rgba(22,45,74,0.10)] backdrop-blur-xl lg:hidden" aria-label="Customer navigation">
        <div className="mx-auto grid max-w-lg grid-cols-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = item.exact
              ? pathname === item.href
              : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "group flex min-w-0 flex-col items-center justify-center gap-1 rounded-2xl px-1 py-2 text-[10px] font-semibold text-[#7d8995] transition-colors",
                  active && "text-[#162d4a]",
                )}
              >
                <span className={cn(
                  "relative flex size-8 items-center justify-center rounded-xl transition-colors group-hover:bg-[#edf3f7]",
                  active && "bg-[#edf3f7]",
                )}>
                  <Icon className="size-5" />
                  {active && <span className="absolute -right-0.5 -top-0.5 size-2 rounded-full border-2 border-white bg-[#608db9]" />}
                </span>
                <span className="max-w-full truncate">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
