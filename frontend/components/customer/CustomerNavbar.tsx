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
  PackageSearch,
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
  { href: "/products", label: "Products", icon: PackageSearch, exact: true },
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
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur md:rounded-t-3xl">
        <div className="mx-auto flex h-16 w-full max-w-[1440px] items-center gap-5 px-4 md:px-6">
        <Link href="/account" className="flex shrink-0 items-center gap-2 rounded-full bg-card px-3 py-1.5">
          <Image
            src="/images/sog-logo.png"
            alt="SOG Glass & Aluminum"
            width={1408}
            height={768}
            className="h-9 w-auto"
            priority
          />
          <span className="hidden text-xs font-medium leading-tight text-foreground sm:block">
            Glass &amp; Aluminum
            <br />
            Customer Portal
          </span>
        </Link>

        <nav aria-label="Customer navigation" className="hidden items-center gap-1 rounded-full bg-card p-1.5 lg:flex">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = item.exact
              ? pathname === item.href
              : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? (pathname === item.href ? "page" : "location") : undefined}
                className={cn(
                  "flex items-center gap-2 rounded-full px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
                  active && "bg-primary font-medium text-primary-foreground",
                )}
              >
                <Icon className="size-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          <div className="flex size-11 items-center justify-center rounded-full bg-card">
            <NotificationBell />
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                aria-label="Account menu"
                className="flex h-11 items-center gap-2 rounded-full bg-card p-1 pr-2 text-left transition-colors hover:bg-muted sm:pr-3"
              >
                <span className="flex size-8 items-center justify-center rounded-full bg-secondary text-xs font-medium text-secondary-foreground">
                  {initials || "CU"}
                </span>
                <span className="hidden max-w-36 truncate text-sm font-medium sm:inline">
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
      </header>

      <nav className="fixed inset-x-0 bottom-0 z-50 border-t bg-white/95 px-3 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur lg:hidden" aria-label="Customer navigation">
        <div className="mx-auto grid max-w-lg grid-cols-4">
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
                  "group flex min-w-0 flex-col items-center justify-center gap-1 rounded-full px-1 py-2 text-[length:var(--customer-small-text,0.625rem)] font-medium text-muted-foreground transition-colors",
                  active && "text-foreground",
                )}
              >
                <span className={cn(
                  "relative flex size-8 items-center justify-center rounded-full transition-colors",
                  active ? "bg-primary text-primary-foreground" : "group-hover:bg-muted",
                )}>
                  <Icon className="size-5" />
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
