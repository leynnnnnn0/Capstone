"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, LogIn, Menu, X } from "lucide-react";
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

function SogLogo({ onClick }: { onClick?: () => void }) {
  return (
    <Link
      href="/"
      aria-label="SOG home"
      onClick={onClick}
      className="flex items-center gap-3"
    >
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
  );
}

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

    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileMenuOpen(false);
    };
    const desktopViewport = window.matchMedia("(min-width: 1024px)");
    const closeOnDesktop = (event: MediaQueryListEvent) => {
      if (event.matches) setMobileMenuOpen(false);
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", closeOnEscape);
    desktopViewport.addEventListener("change", closeOnDesktop);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
      desktopViewport.removeEventListener("change", closeOnDesktop);
    };
  }, [mobileMenuOpen]);

  return (
    <>
      <header
        className={cn(
          "z-50 w-full font-poppins",
          sticky
            ? "sticky top-0 bg-white/95 backdrop-blur-xl"
            : "relative z-30",
        )}
      >
        <div className="relative mx-auto flex w-full max-w-[1440px] items-center justify-between px-4 py-4 sm:px-8 lg:px-16">
          <SogLogo />

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

          <div className="hidden items-center gap-2 lg:flex">
            <Link
              href="/login"
              className="inline-flex min-h-11 items-center gap-2 rounded-full border border-slate-300 bg-white px-5 text-sm font-medium text-slate-800 transition-colors hover:border-slate-950 hover:text-slate-950"
            >
              Login
            </Link>
            <Link
              href={quoteHref}
              className="inline-flex min-h-11 items-center gap-3 rounded-full bg-slate-950 px-6 text-sm font-extralight text-white shadow-lg shadow-slate-950/10 transition-transform hover:-translate-y-0.5"
            >
              Get a quote <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <button
            type="button"
            aria-controls="sog-mobile-navigation"
            aria-expanded={mobileMenuOpen}
            aria-label="Open navigation"
            onClick={() => setMobileMenuOpen(true)}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-300 bg-white/80 text-slate-950 shadow-sm backdrop-blur lg:hidden"
          >
            <Menu className="h-4 w-4" />
          </button>
        </div>
      </header>

      {mobileMenuOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Site navigation"
          className="fixed inset-0 z-[200] flex min-h-dvh flex-col overflow-hidden bg-white font-poppins lg:hidden"
        >
          <div className="mx-auto flex w-full max-w-[1440px] shrink-0 items-center justify-between px-4 py-4 sm:px-8">
            <SogLogo onClick={() => setMobileMenuOpen(false)} />
            <button
              type="button"
              aria-label="Close navigation"
              onClick={() => setMobileMenuOpen(false)}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-950 shadow-sm"
              autoFocus
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <nav
            id="sog-mobile-navigation"
            aria-label="Mobile navigation"
            className="mx-auto grid min-h-0 w-full max-w-xl flex-1 content-start gap-1 overflow-y-auto px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-8 text-sm font-semibold text-slate-700 sm:px-8"
          >
            <div className="grid gap-1 rounded-[1.75rem] border border-slate-200 bg-white p-3 shadow-sm">
              {navigation.map((item) => {
                const active = isActiveRoute(pathname, item);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      "flex items-center justify-between rounded-2xl px-4 py-4 text-base transition-colors hover:bg-slate-100",
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
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="mt-1 inline-flex items-center justify-between rounded-2xl border border-slate-300 bg-white px-4 py-4 text-slate-900 transition-colors hover:border-slate-950"
              >
                <span className="inline-flex items-center gap-2">
                  Login
                </span>
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href={quoteHref}
                onClick={() => setMobileMenuOpen(false)}
                className="inline-flex items-center justify-between rounded-2xl bg-slate-950 px-4 py-4 text-white"
              >
                Get a quote <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </nav>
        </div>
      )}
    </>
  );
}
