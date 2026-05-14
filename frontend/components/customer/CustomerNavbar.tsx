"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell,
  BriefcaseBusiness,
  ChevronDown,
  LayoutDashboard,
  CalendarDays,
  LogOut,
  UserRound,
} from "lucide-react";

import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
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

  async function logout() {
    await api("/api/logout", { method: "POST" });
    router.push("/login");
  }

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white">
      <div className="mx-auto flex h-14 w-full max-w-7xl items-center gap-5 px-4 sm:px-6 lg:px-8">
        <Link href="/account" className="flex shrink-0 items-center">
          <Image
            src="/images/sog-logo.png"
            alt="SOG Glass & Aluminum"
            width={1408}
            height={768}
            className="h-9 w-auto"
            priority
          />
        </Link>

        <nav className="hidden h-full items-center gap-1 lg:flex">
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
                  "relative flex h-full items-center gap-1.5 px-2.5 text-[11px] font-medium text-slate-600 transition-colors hover:text-primary",
                  active && "text-primary",
                )}
              >
                <Icon className="size-3.5" />
                {item.label}
                {active && (
                  <span className="absolute bottom-0 left-3 right-3 h-[3px] rounded-full bg-primary" />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-3">
          <button
            type="button"
            className="relative hidden size-8 items-center justify-center rounded-full text-slate-700 transition-colors hover:bg-slate-100 sm:flex"
            aria-label="Notifications"
          >
            <Bell className="size-4" />
            <span className="absolute right-0.5 top-0.5 flex size-4 items-center justify-center rounded-full bg-primary text-[9px] font-medium text-white">
              3
            </span>
          </button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="flex items-center gap-2 rounded-lg px-2 py-1 text-left transition-colors hover:bg-slate-100"
              >
                <span className="flex size-8 items-center justify-center rounded-lg bg-slate-200 text-xs font-medium text-slate-700">
                  JD
                </span>
                <span className="hidden text-xs font-medium text-slate-800 sm:inline">
                  John Doe
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
      <nav className="flex overflow-x-auto border-t border-slate-100 px-3 lg:hidden">
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
                "relative flex min-w-max items-center gap-1.5 px-3 py-2.5 text-xs font-medium text-slate-600",
                active && "text-primary",
              )}
            >
              <Icon className="size-4" />
              {item.label}
              {active && (
                <span className="absolute bottom-0 left-3 right-3 h-0.5 rounded-full bg-primary" />
              )}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
