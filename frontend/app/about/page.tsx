import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, FileCheck2, Ruler, ScanLine, Wrench } from "lucide-react";

import Footer from "@/components/landing/Footer";
import Navbar from "@/components/landing/Navbar";
import PublicPageHero from "@/components/landing/PublicPageHero";
import { ShimmerImage } from "@/components/ui/shimmer-image";

const title = "About SOG Glass & Aluminum | General Trias, Cavite";
const description =
  "Meet SOG Glass & Aluminum Services, a General Trias-based team providing measurement, fabrication, and installation for homes and businesses across Cavite.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/about" },
  openGraph: {
    title,
    description,
    url: "/about",
    siteName: "SOG Glass & Aluminum Services",
    locale: "en_PH",
    type: "website",
    images: [
      {
        url: "/images/landing/owner-team-v2.png",
        width: 1003,
        height: 1254,
        alt: "SOG owner and installation team with a completed glass and aluminum project",
      },
    ],
  },
};

const connectedWork = [
  {
    icon: Ruler,
    number: "01",
    title: "Measure",
    text: "The opening and site conditions are checked before material is prepared.",
  },
  {
    icon: FileCheck2,
    number: "02",
    title: "Quote",
    text: "The proposed scope, material, finish, and project details are written clearly.",
  },
  {
    icon: ScanLine,
    number: "03",
    title: "Fabricate",
    text: "Frames, glass, panels, and hardware are prepared for the confirmed opening.",
  },
  {
    icon: Wrench,
    number: "04",
    title: "Install",
    text: "The team fits, aligns, and checks the completed system on site.",
  },
];

const productGroups = [
  "Sliding and casement windows",
  "Sliding, swing, and screen doors",
  "Glass partitions and shower enclosures",
  "Aluminum kitchen and modular cabinets",
  "Custom gates and railings",
  "Repair and replacement work",
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white text-[#101820]">
      <Navbar />

      <PublicPageHero
        eyebrow="About SOG"
        title={<>One team.<br />From measure to install.</>}
        description="SOG handles custom glass and aluminum work through one connected process, from the first site visit to the completed installation."
        aside={
          <div className="rounded-full border border-white/20 bg-white/10 px-5 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-white/75 backdrop-blur-sm">
            General Trias · Cavite
          </div>
        }
      />

      <main className="py-2 sm:px-3 sm:py-3">
        <section className="overflow-hidden rounded-[2rem] bg-white px-5 py-20 sm:px-10 sm:py-28 lg:px-16 lg:py-32">
          <div className="mx-auto grid max-w-[1440px] gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:items-center lg:gap-24">
            <div className="relative aspect-[4/5] overflow-hidden rounded-[1.75rem] bg-[#eaf2f8] lg:order-2">
              <ShimmerImage
                src="/images/landing/owner-team-v2.png"
                alt="SOG owner and installation team beside a completed black aluminum glass door"
                fill
                sizes="(max-width: 1023px) 100vw, 50vw"
                className="object-cover"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#162d4a]/40 via-transparent to-transparent" />
              <div className="absolute bottom-5 left-5 right-5 rounded-2xl border border-white/25 bg-[#162d4a]/65 p-5 text-white backdrop-blur-md sm:bottom-7 sm:left-7 sm:right-auto sm:max-w-sm">
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/55">Based in</p>
                <p className="mt-2 text-xl font-medium">Prinza Street, General Trias, Cavite</p>
              </div>
            </div>

            <div className="lg:order-1">
              <span className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.24em] text-[#667584] sm:text-xs">
                <span className="h-1.5 w-1.5 rounded-full bg-[#608db9]" />
                Built for the actual space
              </span>
              <h2 className="mt-4 text-[clamp(2.75rem,6vw,6.5rem)] font-extralight leading-[0.9] tracking-[-0.06em]">
                Work that begins with the opening.
              </h2>
              <div className="mt-8 max-w-2xl space-y-5 text-base leading-8 text-[#667584]">
                <p>
                  SOG Glass &amp; Aluminum Services is a local fabrication and installation team serving General Trias and communities across Cavite.
                </p>
                <p>
                  Instead of treating measurement, quotation, fabrication, and fitting as separate jobs, SOG keeps them connected. That gives the team a clear view of the project from the first dimensions to the final alignment.
                </p>
                <p>
                  The catalog covers residential and commercial openings, storage, enclosures, gates, and railings, with custom dimensions confirmed through an on-site inspection.
                </p>
              </div>
              <div className="mt-10 flex flex-wrap gap-3">
                <Link
                  href="/products"
                  className="inline-flex items-center gap-2 rounded-full bg-[#162d4a] px-6 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-[#2c5282]"
                >
                  Browse products <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/contact"
                  className="inline-flex items-center rounded-full border border-[#cbd6de] px-6 py-3.5 text-sm font-semibold text-[#2c5282] transition-colors hover:border-[#2c5282]"
                >
                  Contact SOG
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-[2rem] bg-[#162d4a] px-5 py-20 text-white sm:px-10 sm:py-28 lg:px-16 lg:py-32">
          <div className="mx-auto max-w-[1440px]">
            <span className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.24em] text-white/55 sm:text-xs">
              <span className="h-1.5 w-1.5 rounded-full bg-[#c8dae8]" />
              One connected process
            </span>
            <h2 className="mt-4 max-w-5xl text-[clamp(2.75rem,6vw,6.5rem)] font-extralight leading-[0.9] tracking-[-0.06em]">
              Responsibility stays with the team.
            </h2>

            <div className="mt-16 grid gap-4 md:grid-cols-2 lg:mt-24 lg:grid-cols-4">
              {connectedWork.map((item) => {
                const Icon = item.icon;

                return (
                  <article key={item.title} className="rounded-[1.5rem] border border-white/15 bg-white/[0.06] p-6 backdrop-blur-sm sm:p-7">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold tracking-[0.18em] text-white/35">{item.number}</span>
                      <span className="flex h-11 w-11 items-center justify-center rounded-full border border-white/20 text-[#c8dae8]">
                        <Icon className="h-5 w-5" />
                      </span>
                    </div>
                    <h3 className="mt-10 text-3xl font-medium tracking-[-0.04em]">{item.title}</h3>
                    <p className="mt-4 text-sm leading-6 text-white/55">{item.text}</p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section className="rounded-[2rem] bg-[#f3f6f8] px-5 py-20 sm:px-10 sm:py-28 lg:px-16 lg:py-32">
          <div className="mx-auto grid max-w-[1440px] gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-24">
            <div>
              <span className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.24em] text-[#667584] sm:text-xs">
                <span className="h-1.5 w-1.5 rounded-full bg-[#608db9]" />
                What SOG makes
              </span>
              <h2 className="mt-4 text-[clamp(2.75rem,5.5vw,5.75rem)] font-extralight leading-[0.9] tracking-[-0.06em]">
                Custom systems for homes and businesses.
              </h2>
              <ul className="mt-10 border-t border-[#cbd6de]">
                {productGroups.map((group, index) => (
                  <li key={group} className="flex items-center gap-5 border-b border-[#cbd6de] py-5 text-base font-medium sm:text-lg">
                    <span className="text-xs font-semibold text-[#8996a2]">0{index + 1}</span>
                    {group}
                  </li>
                ))}
              </ul>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="relative mt-16 aspect-[4/5] overflow-hidden rounded-[1.5rem] bg-[#dfe8ef]">
                <ShimmerImage
                  src="/images/landing/fabrication-clean-v2.jpg"
                  alt="Custom aluminum frames prepared in the SOG fabrication workshop"
                  fill
                  sizes="(max-width: 1023px) 50vw, 25vw"
                  className="object-cover"
                />
              </div>
              <div className="relative aspect-[4/5] overflow-hidden rounded-[1.5rem] bg-[#dfe8ef]">
                <ShimmerImage
                  src="/images/landing/process-installation.png"
                  alt="SOG installers fitting glass and aluminum cabinets on site"
                  fill
                  sizes="(max-width: 1023px) 50vw, 25vw"
                  className="object-cover"
                />
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-[2rem] bg-white px-5 py-20 text-center sm:px-10 sm:py-28 lg:px-16">
          <div className="mx-auto max-w-4xl">
            <span className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#667584] sm:text-xs">Start with the space</span>
            <h2 className="mt-5 text-[clamp(2.75rem,6vw,6rem)] font-extralight leading-[0.9] tracking-[-0.06em]">
              Tell us what needs to fit.
            </h2>
            <p className="mx-auto mt-6 max-w-xl text-sm leading-7 text-[#667584] sm:text-base">
              Share the product, opening, location, or idea. The SOG team can help determine the next measurement and quotation step.
            </p>
            <Link
              href="/contact"
              className="mt-9 inline-flex items-center gap-2 rounded-full bg-[#162d4a] px-7 py-4 text-sm font-semibold text-white transition-colors hover:bg-[#2c5282]"
            >
              Contact the team <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
