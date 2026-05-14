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
} from "lucide-react";

import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

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
      <div className="mx-auto w-full max-w-7xl flex h-[74px] items-center gap-6 px-4 sm:px-6 lg:px-8">
        <Link href="/account" className="flex shrink-0 items-center">
          <Image
            src="/images/sog-logo.png"
            alt="SOG Glass & Aluminum"
            width={1408}
            height={768}
            className="h-14 w-auto"
            priority
          />
        </Link>

        <nav className="hidden h-full items-center gap-2 lg:flex">
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
                  "relative flex h-full items-center gap-2 px-4 text-sm font-semibold text-slate-600 transition-colors hover:text-primary",
                  active && "text-primary",
                )}
              >
                <Icon className="size-5" />
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
            className="relative hidden size-10 items-center justify-center rounded-full text-slate-700 transition-colors hover:bg-slate-100 sm:flex"
            aria-label="Notifications"
          >
            <Bell className="size-5" />
            <span className="absolute right-1 top-1 flex size-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white">
              3
            </span>
          </button>

          <button
            type="button"
            onClick={logout}
            className="flex items-center gap-3 rounded-xl px-2 py-1.5 text-left transition-colors hover:bg-slate-100"
          >
            <span className="flex size-10 items-center justify-center rounded-xl bg-slate-200 text-sm font-bold text-slate-700">
              JD
            </span>
            <span className="hidden text-sm font-semibold text-slate-800 sm:inline">
              John Doe
            </span>
            <ChevronDown className="hidden size-4 text-slate-500 sm:inline" />
          </button>
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
                "relative flex min-w-max items-center gap-2 px-4 py-3 text-sm font-semibold text-slate-600",
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
