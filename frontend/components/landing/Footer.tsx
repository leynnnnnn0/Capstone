import Image from "next/image";
import Link from "next/link";

const footerColumns = [
  {
    heading: "Services",
    links: [
      "Sliding Doors",
      "Swing Doors",
      "Aluminum Windows",
      "Glass Partitions",
      "Cabinets & Racks",
    ],
  },
  {
    heading: "Company",
    links: ["About Us", "Projects", "AR Preview", "Free Inspection"],
  },
  {
    heading: "Contact",
    links: ["Facebook Page", "Messenger", "Viber", "Email Us"],
  },
];

export default function Footer() {
  return (
    <footer className="bg-primary px-4 py-12 sm:px-6 md:px-6 md:py-16 lg:px-8">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 sm:grid-cols-2 md:gap-12 lg:grid-cols-4 lg:gap-16">
        <div>
          <Image
            src="/images/sog-logo.png"
            alt="SOG Logo"
            width={1408}
            height={768}
            className="mb-5 h-12 w-auto"
          />
          <p className="max-w-[200px] text-sm leading-relaxed text-white/50">
            Crafted with precision. Built to last. Designed to impress. SOG
            does it all.
          </p>
        </div>

        {footerColumns.map((col) => (
          <div key={col.heading}>
            <h4 className="mb-4 text-[10px] font-black uppercase tracking-widest text-white/30">
              {col.heading}
            </h4>
            <div className="space-y-2.5">
              {col.links.map((link) => (
                <a
                  key={link}
                  href="#booking"
                  className="block text-sm text-white/50 transition-colors hover:text-[#9eb4c9]"
                >
                  {link}
                </a>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mx-auto mt-8 flex max-w-7xl flex-col items-center justify-between gap-4 border-t border-white/10 px-4 pt-6 md:mt-12 md:flex-row md:gap-0 md:px-12 lg:px-0">
        <span className="text-center text-xs text-white/30 md:text-left">
          © 2026 SOG Glass & Aluminum Services. All rights reserved.
        </span>
        <div className="flex items-center gap-4 text-xs text-white/30">
          <Link href="/staff/login" className="transition-colors hover:text-white/70">
            Staff Login
          </Link>
          <span>Made in the Philippines</span>
        </div>
      </div>
    </footer>
  );
}
