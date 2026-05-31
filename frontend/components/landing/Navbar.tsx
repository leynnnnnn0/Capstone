"use client";

import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";
import { trackPublicRoute } from "@/lib/public-route-history";
import PublicQuoteSheet from "@/components/quote/PublicQuoteSheet";

type NavItem = {
  href: string;
  label: string;
  exact?: boolean;
};

const navItems: NavItem[] = [
  { href: "/", label: "Home", exact: true },
  { href: "/products", label: "Products" },
  { href: "/get-quote", label: "Quote" },
  { href: "/track", label: "Track" },
];

function isActivePath(pathname: string, item: NavItem) {
  return item.exact ? pathname === item.href : pathname.startsWith(item.href);
}

function NavLink({
  item,
  pathname,
  onClick,
}: {
  item: NavItem;
  pathname: string;
  onClick?: () => void;
}) {
  const active = isActivePath(pathname, item);

  return (
    <Link
      href={item.href}
      onClick={onClick}
      className={cn(
        "relative transition-colors hover:text-slate-800",
        active ? "text-slate-900" : "text-slate-500",
      )}
    >
      {item.label}
      {active && (
        <motion.span
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.2 }}
          className="absolute -bottom-1 left-0 h-[2px] w-full rounded-full bg-primary"
          aria-hidden="true"
        />
      )}
    </Link>
  );
}

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  const isHome = pathname === "/";
  const closeMenu = () => setMenuOpen(false);

  useEffect(() => {
    trackPublicRoute();
  }, [pathname]);

  return (
    <motion.nav
      initial={isHome ? { opacity: 0, y: -16 } : false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="sticky top-0 z-50 border-b border-slate-100 bg-white/90 backdrop-blur-xl"
    >
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="hidden grid-cols-3 items-center py-4 md:grid">
          <div className="flex items-center gap-8 text-[11px] font-bold uppercase tracking-widest">
            {navItems.map((item) => (
              <NavLink key={item.href} item={item} pathname={pathname} />
            ))}
          </div>

          <div className="flex items-center justify-center">
            <Link href="/" aria-label="SOG home">
              <Image
                src="/images/sog-logo.png"
                alt="SOG Logo"
                width={1408}
                height={768}
                className="h-12 w-auto"
                priority
              />
            </Link>
          </div>

          <div className="flex items-center justify-end gap-3">
            <PublicQuoteSheet />
            <Link
              href="/login"
              className="cursor-pointer rounded-xl bg-primary px-6 py-2.5 text-[11px] font-bold uppercase tracking-wide text-white shadow-lg transition-all hover:-translate-y-0.5 hover:bg-[#6a8fa8]"
            >
              Login
            </Link>
          </div>
        </div>

        <div className="flex items-center justify-between py-3 md:hidden">
          <Link href="/" aria-label="SOG home" onClick={closeMenu}>
            <Image
              src="/images/sog-logo.png"
              alt="SOG Logo"
              width={1408}
              height={768}
              className="h-10 w-auto"
              priority
            />
          </Link>

          <div className="flex items-center gap-2">
            <PublicQuoteSheet onNavigate={closeMenu} />
            <button
              type="button"
              className="flex h-10 w-10 items-center justify-center rounded-md text-slate-700 transition-colors hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-400"
              onClick={() => setMenuOpen((open) => !open)}
              aria-label="Toggle menu"
              aria-expanded={menuOpen}
            >
              <AnimatePresence initial={false} mode="wait">
                <motion.span
                  key={menuOpen ? "close" : "menu"}
                  initial={{ opacity: 0, rotate: -45, scale: 0.8 }}
                  animate={{ opacity: 1, rotate: 0, scale: 1 }}
                  exit={{ opacity: 0, rotate: 45, scale: 0.8 }}
                  transition={{ duration: 0.15 }}
                >
                  {menuOpen ? <X size={24} /> : <Menu size={24} />}
                </motion.span>
              </AnimatePresence>
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="overflow-hidden border-b border-slate-100 bg-white/95 shadow-sm md:hidden"
          >
          <motion.div
            initial="hidden"
            animate="visible"
            variants={{
              hidden: {},
              visible: { transition: { staggerChildren: 0.05 } },
            }}
            className="mx-auto flex max-w-7xl flex-col items-center gap-4 px-4 py-4 text-[11px] font-bold uppercase tracking-widest sm:px-6"
          >
            {navItems.map((item) => (
              <motion.div
                key={item.href}
                variants={{
                  hidden: { opacity: 0, y: -6 },
                  visible: { opacity: 1, y: 0 },
                }}
              >
                <NavLink
                  item={item}
                  pathname={pathname}
                  onClick={closeMenu}
                />
              </motion.div>
            ))}

            <motion.div
              variants={{
                hidden: { opacity: 0, y: -6 },
                visible: { opacity: 1, y: 0 },
              }}
            >
              <Link
                href="/login"
                className="cursor-pointer rounded-xl bg-primary px-6 py-2.5 text-[11px] font-bold uppercase tracking-wide text-white shadow-lg transition-all hover:-translate-y-0.5 hover:bg-[#6a8fa8]"
                onClick={closeMenu}
              >
                Login
              </Link>
            </motion.div>
          </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}
