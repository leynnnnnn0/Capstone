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
    <div className="px-2 py-2 sm:px-3 sm:py-3">
      <footer className="overflow-hidden rounded-[1.5rem] bg-[#162d4a] px-4 py-10 text-white sm:rounded-[2rem] sm:px-10 sm:py-20 lg:px-16">
        <div className="mx-auto max-w-[1440px]">
          <div className="flex flex-col gap-6 border-b border-white/15 pb-10 sm:flex-row sm:items-end sm:justify-between sm:gap-10 sm:pb-14 lg:pb-20">
            <div>
              <span className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.24em] text-white/55 sm:text-xs">
                <span className="h-1.5 w-1.5 rounded-full bg-[#c8dae8]" />
                Start with certainty
              </span>
              <h2 className="mt-3 max-w-4xl text-[2.5rem] font-medium leading-[0.9] tracking-[-0.055em] sm:mt-4 sm:text-[clamp(3rem,7vw,7rem)] sm:leading-[0.88] sm:tracking-[-0.06em]">
                Let&apos;s frame
                <br />
                what&apos;s next.
              </h2>
            </div>
            <Link
              href="/get-quote"
              className="group inline-flex w-fit items-center gap-3 rounded-full bg-white px-5 py-3 text-xs font-semibold text-[#162d4a] transition-colors hover:bg-[#c8dae8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white sm:px-6 sm:py-3.5 sm:text-sm"
            >
              Get a free quote
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-x-5 gap-y-9 py-10 sm:gap-12 sm:py-14 lg:grid-cols-[1.35fr_0.75fr_0.75fr_0.75fr] lg:gap-10 lg:py-20">
            <div className="col-span-2 max-w-sm sm:col-span-1">
              <Link href="/" aria-label="SOG home" className="inline-flex items-center gap-4">
                <Image
                  src="/images/sog-logo.png"
                  alt="SOG Glass and Aluminum Services"
                  width={128}
                  height={70}
                  className="h-12 w-auto sm:h-14"
                />
                <span className="text-[10px] font-bold uppercase leading-4 tracking-[0.18em] sm:text-xs sm:leading-5">
                  Glass &amp; Aluminum
                  <br />
                  Services
                </span>
              </Link>
              <p className="mt-4 max-w-xs text-xs leading-5 text-white/55 sm:mt-6 sm:text-sm sm:leading-6">
                Crafted with precision. Built to last. Designed to impress.
              </p>
              <p className="mt-3 flex items-start gap-2 text-xs leading-5 text-white/70 sm:mt-6 sm:text-sm sm:leading-6">
                <MapPin className="mt-1 h-4 w-4 shrink-0 text-[#c8dae8]" />
                Prinza Street, General Trias, Cavite
              </p>
            </div>

            {footerColumns.map((column) => (
              <nav key={column.heading} aria-label={`${column.heading} links`}>
                <h3 className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/40">
                  {column.heading}
                </h3>
                <ul className="mt-3 space-y-2 sm:mt-5 sm:space-y-3">
                  {column.links.map((link) => (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        className="text-xs leading-5 text-white/65 transition-colors hover:text-white focus-visible:text-white focus-visible:outline-none sm:text-sm"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            ))}
          </div>

          <div className="flex flex-col gap-3 border-t border-white/15 pt-6 text-[10px] leading-4 text-white/40 sm:flex-row sm:items-center sm:justify-between sm:gap-5 sm:pt-8 sm:text-xs">
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
