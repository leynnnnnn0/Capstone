import Image from "next/image";
import Link from "next/link";
import { ArrowRight, MapPin } from "lucide-react";

const footerColumns = [
  {
    heading: "Products",
    links: [
      { label: "Doors", href: "/products" },
      { label: "Windows", href: "/products" },
      { label: "Glass Partitions", href: "/products" },
      { label: "Cabinets & Enclosures", href: "/products" },
    ],
  },
  {
    heading: "Services",
    links: [
      { label: "On-site Inspection", href: "/#booking" },
      { label: "Custom Fabrication", href: "/#services" },
      { label: "Installation", href: "/#process" },
      { label: "AR Preview", href: "/products" },
    ],
  },
  {
    heading: "Customer",
    links: [
      { label: "Get a Quote", href: "/get-quote" },
      { label: "Track a Request", href: "/track" },
      { label: "Customer Account", href: "/login" },
      { label: "Frequently Asked", href: "/#faq" },
    ],
  },
];

export default function Footer() {
  return (
    <div className="px-2 py-3 sm:px-3">
      <footer className="overflow-hidden rounded-[2rem] bg-[#162d4a] px-5 py-16 text-white sm:px-10 sm:py-20 lg:px-16">
        <div className="mx-auto max-w-[1440px]">
          <div className="flex flex-col gap-10 border-b border-white/15 pb-14 sm:flex-row sm:items-end sm:justify-between lg:pb-20">
            <div>
              <span className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.24em] text-white/55 sm:text-xs">
                <span className="h-1.5 w-1.5 rounded-full bg-[#c8dae8]" />
                Start with certainty
              </span>
              <h2 className="mt-4 max-w-4xl text-[clamp(3rem,7vw,7rem)] font-medium leading-[0.88] tracking-[-0.06em]">
                Let&apos;s frame
                <br />
                what&apos;s next.
              </h2>
            </div>
            <Link
              href="/get-quote"
              className="group inline-flex w-fit items-center gap-3 rounded-full bg-white px-6 py-3.5 text-sm font-semibold text-[#162d4a] transition-colors hover:bg-[#c8dae8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              Get a free quote
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>

          <div className="grid gap-12 py-14 sm:grid-cols-2 lg:grid-cols-[1.35fr_0.75fr_0.75fr_0.75fr] lg:gap-10 lg:py-20">
            <div className="max-w-sm">
              <Link href="/" aria-label="SOG home" className="inline-flex items-center gap-4">
                <Image
                  src="/images/sog-logo.png"
                  alt="SOG Glass and Aluminum Services"
                  width={128}
                  height={70}
                  className="h-14 w-auto"
                />
                <span className="text-xs font-bold uppercase leading-5 tracking-[0.18em]">
                  Glass &amp; Aluminum
                  <br />
                  Services
                </span>
              </Link>
              <p className="mt-6 max-w-xs text-sm leading-6 text-white/55">
                Crafted with precision. Built to last. Designed to impress.
              </p>
              <p className="mt-6 flex items-start gap-2 text-sm leading-6 text-white/70">
                <MapPin className="mt-1 h-4 w-4 shrink-0 text-[#c8dae8]" />
                Prinza Street, General Trias, Cavite
              </p>
            </div>

            {footerColumns.map((column) => (
              <nav key={column.heading} aria-label={`${column.heading} links`}>
                <h3 className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/40">
                  {column.heading}
                </h3>
                <ul className="mt-5 space-y-3">
                  {column.links.map((link) => (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        className="text-sm text-white/65 transition-colors hover:text-white focus-visible:text-white focus-visible:outline-none"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            ))}
          </div>

          <div className="flex flex-col gap-5 border-t border-white/15 pt-8 text-xs text-white/40 sm:flex-row sm:items-center sm:justify-between">
            <span>© 2026 SOG Glass &amp; Aluminum Services. All rights reserved.</span>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
              <Link href="/staff/login" className="transition-colors hover:text-white/75">
                Staff login
              </Link>
              <span>Made in the Philippines</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
