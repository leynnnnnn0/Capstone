import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, AtSign, MapPin, MessageCircle, Phone, Ruler } from "lucide-react";

import Booking from "@/components/landing/Booking";
import Footer from "@/components/landing/Footer";
import Navbar from "@/components/landing/Navbar";
import PublicPageHero from "@/components/landing/PublicPageHero";

const title = "Contact SOG Glass & Aluminum | General Trias, Cavite";
const description =
  "Call SOG Glass & Aluminum Services at 0936 689 7991 for custom doors, windows, cabinets, enclosures, gates, railings, measurement, and installation in Cavite.";
const phoneDisplay = "0936 689 7991";
const phoneHref = "tel:+639366897991";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/contact" },
  openGraph: {
    title,
    description,
    url: "/contact",
    siteName: "SOG Glass & Aluminum Services",
    locale: "en_PH",
    type: "website",
    images: [
      {
        url: "/images/landing/process-site-measurement.jpg",
        width: 887,
        height: 665,
        alt: "SOG technician measuring a project opening on site",
      },
    ],
  },
};

const contactDetails = [
  {
    icon: Phone,
    eyebrow: "Call",
    title: phoneDisplay,
    text: "For product questions, project details, directions, and scheduling.",
    href: phoneHref,
    action: "Call SOG",
  },
  {
    icon: MapPin,
    eyebrow: "Location",
    title: "Prinza Street",
    text: "General Trias, Cavite, Philippines. Call first for current directions and team availability.",
  },
  {
    icon: AtSign,
    eyebrow: "Facebook",
    title: "SOG Glass-Aluminum",
    text: "Official page name: SOG Glass-Aluminum Steel Fabrication Services.",
  },
  {
    icon: Ruler,
    eyebrow: "Service area",
    title: "Cavite",
    text: "Based in General Trias and serving projects across Cavite. Larger projects outside Cavite are reviewed by location.",
  },
];

const localBusiness = {
  "@context": "https://schema.org",
  "@type": "HomeAndConstructionBusiness",
  name: "SOG Glass & Aluminum Services",
  alternateName: "SOG Glass-Aluminum Steel Fabrication Services",
  url: "https://sogglassandaluminum.com/contact",
  image: "https://sogglassandaluminum.com/images/landing/owner-team-v2.png",
  telephone: "+639366897991",
  address: {
    "@type": "PostalAddress",
    streetAddress: "Prinza Street",
    addressLocality: "General Trias",
    addressRegion: "Cavite",
    addressCountry: "PH",
  },
  areaServed: {
    "@type": "AdministrativeArea",
    name: "Cavite",
  },
  description,
};

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-white text-[#101820]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusiness).replace(/</g, "\\u003c") }}
      />
      <Navbar />

      <PublicPageHero
        eyebrow="Contact SOG"
        title={<>Start with the space.<br />We&apos;ll take it from there.</>}
        description="Tell us what you want to build, replace, or measure. The SOG team can help identify the right next step for your project."
        aside={
          <a
            href={phoneHref}
            className="group inline-flex items-center gap-3 rounded-full bg-white px-5 py-3.5 text-sm font-semibold text-[#162d4a] transition-colors hover:bg-[#c8dae8]"
          >
            <Phone className="h-4 w-4" />
            {phoneDisplay}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </a>
        }
      />

      <main className="py-2 sm:px-3 sm:py-3">
        <section className="rounded-[2rem] bg-[#f3f6f8] px-5 py-20 sm:px-10 sm:py-28 lg:px-16 lg:py-32">
          <div className="mx-auto max-w-[1440px]">
            <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
              <div>
                <span className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.24em] text-[#667584] sm:text-xs">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#608db9]" />
                  Reach the team
                </span>
                <h2 className="mt-4 text-[clamp(2.75rem,6vw,6rem)] font-extralight leading-[0.9] tracking-[-0.06em]">
                  A clear first conversation.
                </h2>
              </div>
              <p className="max-w-xl text-base leading-8 text-[#667584] lg:justify-self-end">
                Rough dimensions and a photo can help start the discussion. Final fabrication dimensions are confirmed during the site measurement.
              </p>
            </div>

            <div className="mt-14 grid gap-4 md:grid-cols-2 lg:mt-20">
              {contactDetails.map((detail) => {
                const Icon = detail.icon;
                const card = (
                  <>
                    <div className="flex items-start justify-between gap-4">
                      <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#8996a2]">{detail.eyebrow}</span>
                      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#eaf2f8] text-[#2c5282]">
                        <Icon className="h-5 w-5" />
                      </span>
                    </div>
                    <h3 className="mt-10 text-3xl font-medium tracking-[-0.04em] sm:text-4xl">{detail.title}</h3>
                    <p className="mt-4 max-w-lg text-sm leading-7 text-[#667584]">{detail.text}</p>
                    {detail.action && (
                      <span className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-[#2c5282]">
                        {detail.action} <ArrowRight className="h-4 w-4" />
                      </span>
                    )}
                  </>
                );

                return detail.href ? (
                  <a
                    key={detail.eyebrow}
                    href={detail.href}
                    className="group rounded-[1.5rem] border border-[#dce4ea] bg-white p-6 transition-transform hover:-translate-y-1 sm:p-8"
                  >
                    {card}
                  </a>
                ) : (
                  <article key={detail.eyebrow} className="rounded-[1.5rem] border border-[#dce4ea] bg-white p-6 sm:p-8">
                    {card}
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section className="rounded-[2rem] bg-white px-5 py-20 sm:px-10 sm:py-28 lg:px-16">
          <div className="mx-auto grid max-w-[1440px] gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-24">
            <div>
              <span className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.24em] text-[#667584] sm:text-xs">
                <span className="h-1.5 w-1.5 rounded-full bg-[#608db9]" />
                Before you contact us
              </span>
              <h2 className="mt-4 text-[clamp(2.75rem,5.5vw,5.5rem)] font-extralight leading-[0.9] tracking-[-0.06em]">
                Three details help us begin.
              </h2>
            </div>

            <ol className="border-t border-[#dce4ea]">
              {[
                ["01", "The product or type of work", "For example: sliding window, shower enclosure, cabinet, gate, repair, or a custom opening."],
                ["02", "Your project location", "Share the city or municipality first so the team can confirm service availability."],
                ["03", "A photo or rough size", "A clear photo and approximate width and height help with the initial conversation; final dimensions are measured on site."],
              ].map(([number, heading, text]) => (
                <li key={number} className="grid gap-4 border-b border-[#dce4ea] py-7 sm:grid-cols-[3rem_0.75fr_1.25fr] sm:items-start sm:gap-6">
                  <span className="text-xs font-semibold text-[#8996a2]">{number}</span>
                  <h3 className="text-xl font-medium tracking-[-0.03em]">{heading}</h3>
                  <p className="text-sm leading-7 text-[#667584]">{text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="rounded-[2rem] bg-[#162d4a] px-5 py-14 text-white sm:px-10 lg:px-16">
          <div className="mx-auto flex max-w-[1440px] flex-col gap-7 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/10 text-[#c8dae8]">
                <MessageCircle className="h-5 w-5" />
              </span>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/45">Prefer an estimate first?</p>
                <p className="mt-1 text-xl font-medium">Build a quotation from the product catalog.</p>
              </div>
            </div>
            <Link
              href="/get-quote"
              className="inline-flex w-fit items-center gap-2 rounded-full bg-white px-6 py-3.5 text-sm font-semibold text-[#162d4a] transition-colors hover:bg-[#c8dae8]"
            >
              Start a quote <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>

        <Booking />
      </main>

      <Footer />
    </div>
  );
}
