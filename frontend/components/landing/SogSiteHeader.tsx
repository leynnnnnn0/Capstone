"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Menu, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";
import { trackPublicRoute } from "@/lib/public-route-history";

const navigation = [
  { href: "/", label: "Home", exact: true },
  { href: "/products", label: "Products" },
  { href: "/get-quote", label: "Quote" },
  { href: "/track", label: "Track" },
];

function isActiveRoute(
  pathname: string,
  item: (typeof navigation)[number],
) {
  return item.exact
    ? pathname === item.href
    : pathname === item.href || pathname.startsWith(`${item.href}/`);
}

type SogSiteHeaderProps = {
  sticky?: boolean;
  quoteHref?: string;
};

export default function SogSiteHeader({
  sticky = false,
  quoteHref = "/get-quote",
}: SogSiteHeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    trackPublicRoute();
  }, [pathname]);

  useEffect(() => {
    if (!mobileMenuOpen) return;

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileMenuOpen(false);
    };

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [mobileMenuOpen]);

  return (
    <header
      className={cn(
        "z-50 w-full font-poppins",
        sticky
          ? "sticky top-0 bg-white/95 backdrop-blur-xl"
          : "relative z-30",
      )}
    >
      <div className="relative mx-auto flex w-full max-w-[1440px] items-center justify-between px-4 py-4 sm:px-8 lg:px-16">
        <Link href="/" aria-label="SOG home" className="flex items-center gap-3">
          <Image
            src="/images/sog-logo.png"
            alt="SOG Glass and Aluminum Services"
            width={128}
            height={70}
            className="h-12 w-auto sm:h-14"
            priority
          />
          <span className="hidden text-[10px] font-semibold uppercase leading-[1.4] tracking-[0.16em] text-black sm:block">
            Glass &amp; Aluminum
            <br />
            Services
          </span>
        </Link>

        <nav
          className="hidden items-center gap-9 text-sm font-extralight text-slate-600 lg:flex"
          aria-label="Primary navigation"
        >
          {navigation.map((item) => {
            const active = isActiveRoute(pathname, item);

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative py-2 transition-colors after:absolute after:inset-x-0 after:-bottom-0.5 after:h-px after:origin-left after:bg-slate-950 after:transition-transform hover:text-slate-950",
                  active
                    ? "font-medium text-slate-950 after:scale-x-100"
                    : "after:scale-x-0",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <Link
          href={quoteHref}
          className="hidden min-h-11 items-center gap-3 rounded-full bg-slate-950 px-6 text-sm font-extralight text-white shadow-lg shadow-slate-950/10 transition-transform hover:-translate-y-0.5 lg:inline-flex"
        >
          Get a quote <ArrowRight className="h-4 w-4" />
        </Link>

        <button
          type="button"
          aria-controls="sog-mobile-navigation"
          aria-expanded={mobileMenuOpen}
          aria-label={mobileMenuOpen ? "Close navigation" : "Open navigation"}
          onClick={() => setMobileMenuOpen((open) => !open)}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-300 bg-white/80 text-slate-950 shadow-sm backdrop-blur lg:hidden"
        >
          {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </button>

        {mobileMenuOpen && (
          <nav
            id="sog-mobile-navigation"
            aria-label="Mobile navigation"
            className="absolute inset-x-4 top-full z-50 mt-2 grid gap-1 rounded-2xl border border-slate-200 bg-white/95 p-3 text-sm font-semibold text-slate-700 shadow-xl backdrop-blur sm:inset-x-8 lg:hidden"
          >
            {navigation.map((item) => {
              const active = isActiveRoute(pathname, item);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center justify-between rounded-xl px-4 py-3 hover:bg-slate-100",
                    active && "bg-slate-100 font-bold text-slate-950",
                  )}
                >
                  {item.label}
                  {active && (
                    <span
                      aria-hidden="true"
                      className="h-1.5 w-1.5 rounded-full bg-[#2563eb]"
                    />
                  )}
                </Link>
              );
            })}
            <Link
              href={quoteHref}
              onClick={() => setMobileMenuOpen(false)}
              className="mt-1 inline-flex items-center justify-between rounded-xl bg-slate-950 px-4 py-3 text-white"
            >
              Get a quote <ArrowRight className="h-4 w-4" />
            </Link>
          </nav>
        )}
      </div>
    </header>
  );
}
