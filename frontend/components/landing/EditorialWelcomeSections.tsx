"use client";

import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  ArrowUpRight,
  Box,
  ChevronDown,
  FileCheck2,
  Ruler,
  ScanLine,
  Wrench,
} from "lucide-react";
import { useState } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import type { Product } from "@/features/products/types";
import {
  productCategories,
  productCover,
} from "@/features/products/product-utils";
import { cn } from "@/lib/utils";

type ProductGridProps = {
  products: Product[];
  loading: boolean;
  error: string;
};

const easeOut = [0.16, 1, 0.3, 1] as const;
const viewport = { once: true, amount: 0.18 };

const reveal = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0 },
};

const values = [
  {
    icon: ScanLine,
    title: "See it in your space",
    text: "Preview compatible products in AR before deciding on the final system.",
    image: "/images/landing/process-ar-preview.jpg",
    alt: "Phone previewing a black aluminum sliding window in augmented reality",
    position: "center",
  },
  {
    icon: Ruler,
    title: "Measured on site",
    text: "SOG technicians confirm the opening and the dimensions before fabrication.",
    image: "/images/landing/process-site-measurement.jpg",
    alt: "SOG technician measuring a residential window opening on site",
    position: "center 42%",
  },
  {
    icon: FileCheck2,
    title: "Quoted clearly",
    text: "Review an itemised scope, materials, and project details before work begins.",
    image: "/images/landing/process-quote-review.jpg",
    alt: "Homeowner reviewing an itemised window quotation and material samples",
    position: "center",
  },
  {
    icon: Wrench,
    title: "Installed properly",
    text: "Fabrication and fitting stay coordinated through one accountable team.",
    image: "/images/landing/process-installation.png",
    alt: "SOG installation crew fitting glass and aluminum kitchen cabinets",
    position: "center",
  },
];

const services = [
  {
    name: "Sliding Doors & Windows",
    text: "Space-saving aluminum systems for homes and commercial interiors.",
    href: "/products",
  },
  {
    name: "Swing & Frameless Doors",
    text: "Clean entrances with tempered-glass options made for the opening.",
    href: "/products",
  },
  {
    name: "Glass Partitions",
    text: "Bright, modern dividers for offices, shops, and residential spaces.",
    href: "/products",
  },
  {
    name: "Custom Cabinets & Enclosures",
    text: "Made-to-measure glass and aluminum fabrication for specialised storage.",
    href: "/get-quote",
  },
  {
    name: "Repair & Replacement",
    text: "Assessment and replacement for damaged panels, hardware, and frames.",
    href: "/get-quote",
  },
];

const projects = [
  {
    name: "Owner-Led Service",
    text: "The SOG owner and crew stay hands-on from site visit to final installation.",
    image: "/images/landing/owner-team-v2.png",
    alt: "SOG owner and installation crew beside a finished black aluminum glass door",
  },
  {
    name: "Measured to Fit",
    text: "Site dimensions are checked before material is cut and assembled.",
    image: "/images/landing/measuring.png",
    alt: "Technicians measuring a wall opening before fabrication",
  },
  {
    name: "Custom Fabrication",
    text: "Frames, panels, finishes, and hardware prepared for the project.",
    image: "/images/landing/fabrication-clean-v2.jpg",
    alt: "Custom white aluminum frames arranged in an organized fabrication workshop",
  },
];

const processSteps = [
  {
    title: "Choose or describe",
    text: "Browse products or tell us what the space needs.",
  },
  {
    title: "Measure",
    text: "Schedule the free on-site inspection and confirm dimensions.",
  },
  {
    title: "Approve",
    text: "Review the itemised quotation, material, finish, and schedule.",
  },
  {
    title: "Fabricate & install",
    text: "We prepare the system and coordinate the installation.",
  },
];

const stats = [
  ["500+", "Completed installations across the metro"],
  ["100%", "Free on-site inspection with no hidden charge"],
  ["AR Ready", "Visualisation for compatible product models"],
  ["5 stars", "For craftsmanship, speed, and support"],
];

const faqs = [
  {
    question: "What types of glass do you use?",
    answer:
      "We use tempered, laminated, frosted, and clear float glass depending on the application. Our team recommends the most suitable type based on safety requirements and the intended finish.",
  },
  {
    question: "How long does fabrication and installation take?",
    answer:
      "Most orders are completed within 7–14 business days from measurement confirmation. Complex or large commercial orders may take 3–4 weeks.",
  },
  {
    question: "Is the on-site inspection free?",
    answer:
      "Yes. Our technician can visit, measure, and prepare a detailed itemised quotation at no charge.",
  },
  {
    question: "Which areas do you service?",
    answer:
      "We currently serve Metro Manila, Cavite, Laguna, Bulacan, and Rizal. Contact us to confirm availability for locations beyond these areas.",
  },
  {
    question: "How does the AR preview work?",
    answer:
      "Open an AR-ready product on a compatible mobile device, point the camera at the intended area, and place the model to preview its scale and appearance before ordering.",
  },
];

function Eyebrow({ children, light = false }: { children: React.ReactNode; light?: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.24em] sm:text-xs",
        light ? "text-white/60" : "text-[#667584]",
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", light ? "bg-[#c8dae8]" : "bg-[#608db9]")} />
      {children}
    </span>
  );
}

function SectionHeading({ children, light = false }: { children: React.ReactNode; light?: boolean }) {
  return (
    <h2
      className={cn(
        "mt-4 max-w-4xl text-[clamp(2.75rem,6vw,6.75rem)] font-extralight leading-[0.9] tracking-[-0.06em]",
        light ? "text-white" : "text-[#101820]",
      )}
    >
      {children}
    </h2>
  );
}

export function ValueSection() {
  const reducedMotion = useReducedMotion();

  return (
    <section id="about" className="px-2 pt-3 sm:px-3">
      <div className="overflow-hidden rounded-[2rem] bg-white px-5 py-20 sm:px-10 sm:py-28 lg:px-16 lg:py-36">
        <div className="mx-auto max-w-[1440px]">
          <motion.div
            initial={reducedMotion ? false : "hidden"}
            whileInView="visible"
            viewport={viewport}
            variants={reveal}
            transition={{ duration: 0.7, ease: easeOut }}
            className="grid gap-10 lg:grid-cols-[1.3fr_0.7fr] lg:items-end"
          >
            <div>
              <Eyebrow>Why SOG</Eyebrow>
              <SectionHeading>
                From rough opening to finished installation.
              </SectionHeading>
            </div>
            <p className="max-w-xl text-base leading-7 text-[#667584] sm:text-lg sm:leading-8">
              One team measures, quotes, fabricates, and installs—reducing the
              coordination errors that happen when a project is passed between
              separate suppliers and contractors.
            </p>
          </motion.div>

          <div className="mt-16 grid gap-4 md:grid-cols-2 lg:mt-24 lg:grid-cols-4">
            {values.map((item, index) => {
              const Icon = item.icon;
              return (
                <motion.article
                  key={item.title}
                  initial={reducedMotion ? false : "hidden"}
                  whileInView="visible"
                  viewport={viewport}
                  variants={reveal}
                  transition={{ duration: 0.6, delay: index * 0.08, ease: easeOut }}
                  whileHover={reducedMotion ? undefined : { y: -5 }}
                  className="group overflow-hidden rounded-[1.5rem] border border-[#dce4ea] bg-[#f3f6f8]"
                >
                  <div className="relative aspect-[16/10] overflow-hidden bg-[#dfe8ef] lg:aspect-[4/3]">
                    <Image
                      src={item.image}
                      alt={item.alt}
                      fill
                      sizes="(max-width: 767px) 100vw, (max-width: 1023px) 50vw, 25vw"
                      className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.035]"
                      style={{ objectPosition: item.position }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#162d4a]/25 via-transparent to-black/5" />
                    <div className="absolute left-4 top-4 flex h-11 w-11 items-center justify-center rounded-full border border-white/50 bg-white/90 text-[#2c5282] shadow-sm backdrop-blur-sm">
                      <Icon className="h-5 w-5" />
                    </div>
                  </div>

                  <div className="flex min-h-52 flex-col p-6 sm:p-7">
                    <span className="text-xs font-semibold tracking-[0.15em] text-[#9aa8b4]">
                      0{index + 1}
                    </span>
                    <h3 className="mt-3 text-2xl font-medium tracking-[-0.035em] text-[#101820]">
                      {item.title}
                    </h3>
                    <p className="mt-3 text-sm leading-6 text-[#667584]">{item.text}</p>
                  </div>
                </motion.article>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

export function ServicesSection() {
  const reducedMotion = useReducedMotion();

  return (
    <section id="services" className="px-2 pt-3 sm:px-3">
      <div className="rounded-[2rem] bg-[#f3f6f8] px-5 py-20 sm:px-10 sm:py-28 lg:px-16 lg:py-32">
        <div className="mx-auto max-w-[1440px]">
          <Eyebrow>What we make</Eyebrow>
          <SectionHeading>Made for every opening.</SectionHeading>

          <div className="mt-14 border-t border-[#dce4ea] sm:mt-20">
            {services.map((service, index) => (
              <motion.div
                key={service.name}
                initial={reducedMotion ? false : "hidden"}
                whileInView="visible"
                viewport={viewport}
                variants={reveal}
                transition={{ duration: 0.55, delay: index * 0.06, ease: easeOut }}
              >
                <Link
                  href={service.href}
                  className="group grid gap-4 border-b border-[#dce4ea] py-7 outline-none transition-colors hover:bg-white/60 focus-visible:bg-white/70 sm:grid-cols-[3rem_1fr_1fr_3rem] sm:items-center sm:gap-6 sm:px-3 sm:py-9"
                >
                  <span className="text-xs font-semibold text-[#8996a2]">0{index + 1}</span>
                  <h3 className="text-2xl font-medium tracking-[-0.04em] text-[#101820] sm:text-3xl lg:text-4xl">
                    {service.name}
                  </h3>
                  <p className="max-w-lg text-sm leading-6 text-[#667584] sm:pr-4">{service.text}</p>
                  <span className="hidden h-11 w-11 items-center justify-center rounded-full border border-[#cbd6de] text-[#2c5282] transition-all duration-300 group-hover:translate-x-1 group-hover:border-[#2c5282] group-hover:bg-[#2c5282] group-hover:text-white sm:flex">
                    <ArrowRight className="h-4 w-4" />
                  </span>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export function ProjectShowcase() {
  const reducedMotion = useReducedMotion();

  return (
    <section id="installations" className="px-2 pt-3 sm:px-3 ">
      <div className="overflow-hidden rounded-[2rem] bg-white px-5 py-20 sm:px-10 sm:py-28 lg:px-16 lg:py-32">
        <div className="mx-auto max-w-[1440px]">
          <div className="grid gap-8 lg:grid-cols-[0.75fr_1.25fr] lg:items-end">
            <div>
              <Eyebrow>Built in detail</Eyebrow>
              <SectionHeading>Precision you can see.</SectionHeading>
            </div>
            <p className="max-w-xl text-base leading-7 text-[#667584] lg:justify-self-end lg:text-lg lg:leading-8">
              From first measurement to final alignment, every detail is checked
              for fit, finish, and everyday use.
            </p>
          </div>

          <div className="mt-14 grid gap-5 md:mt-20 md:grid-cols-3 md:items-end">
            {projects.map((project, index) => (
              <motion.figure
                key={project.name}
                initial={reducedMotion ? false : { opacity: 0, y: 42 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={viewport}
                transition={{ duration: 0.65, delay: index * 0.1, ease: easeOut }}
                whileHover={reducedMotion ? undefined : { y: -5 }}
                className={cn(
                  "group relative overflow-hidden rounded-[1.5rem] bg-[#eaf2f8]",
                  index === 0 ? "aspect-[4/5]" : index === 1 ? "aspect-[4/5] md:mb-10" : "aspect-[4/5]",
                )}
              >
                <Image
                  src={project.image}
                  alt={project.alt}
                  fill
                  sizes="(max-width: 767px) 100vw, 33vw"
                  className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.025]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#162d4a]/85 via-[#162d4a]/5 to-transparent" />
                <figcaption className="absolute inset-x-4 bottom-4 rounded-2xl border border-white/20 bg-[#162d4a]/55 p-5 text-white backdrop-blur-md sm:inset-x-5 sm:bottom-5">
                  <h3 className="text-lg font-medium tracking-[-0.025em]">{project.name}</h3>
                  <p className="mt-2 text-xs leading-5 text-white/70">{project.text}</p>
                </figcaption>
              </motion.figure>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export function ProcessAndStatsSection() {
  const reducedMotion = useReducedMotion();

  return (
    <section id="process" className="px-2 pt-3 sm:px-3">
      <div className="overflow-hidden rounded-[2rem] bg-[#162d4a] px-5 py-20 text-white sm:px-10 sm:py-28 lg:px-16 lg:py-32">
        <div className="mx-auto max-w-[1440px]">
          <Eyebrow light>How it works</Eyebrow>
          <SectionHeading light>
            Measured once.
            <br />
            Handled end to end.
          </SectionHeading>

          <div className="relative mt-16 grid gap-4 md:grid-cols-2 lg:mt-24 lg:grid-cols-4">
            <motion.div
              aria-hidden="true"
              initial={reducedMotion ? false : { scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={viewport}
              transition={{ duration: 1, ease: easeOut }}
              className="absolute left-0 right-0 top-5 hidden h-px origin-left bg-white/20 lg:block"
            />
            {processSteps.map((step, index) => (
              <motion.article
                key={step.title}
                initial={reducedMotion ? false : "hidden"}
                whileInView="visible"
                viewport={viewport}
                variants={reveal}
                transition={{ duration: 0.55, delay: index * 0.09, ease: easeOut }}
                className="relative rounded-[1.5rem] border border-white/15 bg-white/[0.06] p-6 backdrop-blur-sm lg:border-0 lg:bg-transparent lg:px-0 lg:pt-14 lg:backdrop-blur-none"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-full border border-white/25 bg-[#162d4a] text-xs font-semibold lg:absolute lg:left-0 lg:top-0 lg:-translate-y-1/2">
                  0{index + 1}
                </span>
                <h3 className="mt-10 text-xl font-medium tracking-[-0.025em] lg:mt-0">{step.title}</h3>
                <p className="mt-3 max-w-xs text-sm leading-6 text-white/60">{step.text}</p>
              </motion.article>
            ))}
          </div>

          <div className="mt-20 border-t border-white/15 pt-16 lg:mt-28 lg:pt-20">
            <Eyebrow light>By the numbers</Eyebrow>
            <dl className="mt-10 grid grid-cols-2 gap-x-5 gap-y-10 lg:grid-cols-4 lg:gap-8">
              {stats.map(([value, label], index) => (
                <motion.div
                  key={value}
                  initial={reducedMotion ? false : "hidden"}
                  whileInView="visible"
                  viewport={viewport}
                  variants={reveal}
                  transition={{ duration: 0.55, delay: index * 0.08, ease: easeOut }}
                  className="border-t border-white/20 pt-5"
                >
                  <dt className="sr-only">{label}</dt>
                  <dd>
                    <span className="block text-[clamp(2rem,5vw,5rem)] font-medium leading-none tracking-[-0.055em]">
                      {value}
                    </span>
                    <span className="mt-4 block max-w-52 text-xs leading-5 text-white/55 sm:text-sm">{label}</span>
                  </dd>
                </motion.div>
              ))}
            </dl>
          </div>
        </div>
      </div>
    </section>
  );
}

function formatPrice(value: number | string) {
  return Number(value).toLocaleString("en-PH", { maximumFractionDigits: 0 });
}

export function ProductGridSection({ products, loading, error }: ProductGridProps) {
  const reducedMotion = useReducedMotion();

  return (
    <section id="products" className="px-2 pt-3 sm:px-3">
      <div className="rounded-[2rem] bg-[#f3f6f8] px-5 py-20 sm:px-10 sm:py-28 lg:px-16 lg:py-32">
        <div className="mx-auto max-w-[1440px]">
          <div className="flex flex-col gap-8 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <Eyebrow>Our products</Eyebrow>
              <SectionHeading>Built to your exact specs.</SectionHeading>
            </div>
            <Link
              href="/products"
              className="group inline-flex w-fit items-center gap-3 rounded-full border border-[#cbd6de] px-5 py-3 text-sm font-semibold text-[#2c5282] transition-colors hover:bg-[#2c5282] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#608db9]"
            >
              View all products
              <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>
          </div>

          <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:mt-20 lg:grid-cols-3">
            {products.map((product, index) => {
              const image = productCover(product);
              const category = productCategories(product)[0];
              return (
                <motion.article
                  key={product.id}
                  initial={reducedMotion ? false : "hidden"}
                  whileInView="visible"
                  viewport={viewport}
                  variants={reveal}
                  transition={{ duration: 0.55, delay: (index % 3) * 0.08, ease: easeOut }}
                  whileHover={reducedMotion ? undefined : { y: -5 }}
                  className="group overflow-hidden rounded-[1.5rem] border border-[#dce4ea] bg-white"
                >
                  <Link href={`/products/${product.id}`} className="relative block aspect-[4/3] overflow-hidden bg-[#eaf2f8]">
                    {image ? (
                      <Image
                        src={image}
                        alt={product.name}
                        fill
                        sizes="(max-width: 639px) 100vw, (max-width: 1023px) 50vw, 33vw"
                        className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.025]"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-[#608db9]">
                        <Box className="h-10 w-10" />
                      </div>
                    )}
                  </Link>
                  <div className="p-6">
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#608db9]">
                        {category?.name || "Custom system"}
                      </span>
                      {Number(product.price_per_unit) > 0 && (
                        <span className="whitespace-nowrap text-xs font-semibold text-[#667584]">
                          From PHP {formatPrice(product.price_per_unit)}/{product.unit}
                        </span>
                      )}
                    </div>
                    <h3 className="mt-4 text-2xl font-medium tracking-[-0.035em] text-[#101820]">{product.name}</h3>
                    <p className="mt-3 line-clamp-2 min-h-12 text-sm leading-6 text-[#667584]">{product.description}</p>
                    <div className="mt-6 flex flex-wrap gap-2">
                      <Link href={`/products/${product.id}`} className="rounded-full bg-[#162d4a] px-4 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-[#2c5282]">
                        View product
                      </Link>
                      <Link href={`/get-quote?product=${product.id}`} className="rounded-full border border-[#cbd6de] px-4 py-2.5 text-xs font-semibold text-[#2c5282] transition-colors hover:border-[#2c5282]">
                        Get quote
                      </Link>
                    </div>
                  </div>
                </motion.article>
              );
            })}

            {loading && Array.from({ length: 3 }, (_, index) => (
              <div key={index} className="overflow-hidden rounded-[1.5rem] border border-[#dce4ea] bg-white">
                <Skeleton className="aspect-[4/3] rounded-none" />
                <div className="space-y-4 p-6">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-7 w-2/3" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-9 w-32 rounded-full" />
                </div>
              </div>
            ))}

            {!loading && products.length === 0 && (
              <div className="rounded-[1.5rem] border border-dashed border-[#cbd6de] px-6 py-20 text-center text-sm text-[#667584] sm:col-span-2 lg:col-span-3">
                {error || "No products are available right now."}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

export function FaqSection() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const reducedMotion = useReducedMotion();

  return (
    <section id="faq" className="px-2 pt-3 sm:px-3">
      <div className="rounded-[2rem] bg-white px-5 py-20 sm:px-10 sm:py-28 lg:px-16 lg:py-32">
        <div className="mx-auto grid max-w-[1440px] gap-14 lg:grid-cols-[0.75fr_1.25fr] lg:gap-24">
          <div className="lg:sticky lg:top-24 lg:self-start">
            <Eyebrow>Common questions</Eyebrow>
            <SectionHeading>A clearer answer, before you commit.</SectionHeading>
            <p className="mt-7 max-w-md text-sm leading-6 text-[#667584] sm:text-base sm:leading-7">
              Still deciding? Start a quote or book a free inspection so the team can confirm what your opening needs.
            </p>
            <Link href="/get-quote" className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-[#2c5282] hover:underline">
              Start a quote <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="border-t border-[#dce4ea]">
            {faqs.map((faq, index) => {
              const isOpen = openFaq === index;
              const panelId = `welcome-faq-panel-${index}`;
              return (
                <div key={faq.question} className="border-b border-[#dce4ea]">
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    aria-controls={panelId}
                    onClick={() => setOpenFaq(isOpen ? null : index)}
                    className="group flex w-full items-center justify-between gap-6 py-6 text-left text-lg font-medium tracking-[-0.02em] text-[#101820] outline-none focus-visible:text-[#2c5282] sm:py-8 sm:text-xl"
                  >
                    <span>{faq.question}</span>
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#cbd6de] text-[#2c5282] transition-colors group-hover:border-[#2c5282]">
                      <ChevronDown className={cn("h-4 w-4 transition-transform duration-300", isOpen && "rotate-180")} />
                    </span>
                  </button>
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        id={panelId}
                        initial={reducedMotion ? false : { height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: reducedMotion ? 0 : 0.3, ease: easeOut }}
                        className="overflow-hidden"
                      >
                        <p className="max-w-2xl pb-7 pr-12 text-sm leading-7 text-[#667584] sm:pb-9 sm:text-base">{faq.answer}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

export function BookingIntro() {
  return (
    <section className="px-2 pt-3 sm:px-3">
      <div className="rounded-[2rem] bg-[#eaf2f8] px-5 py-16 sm:px-10 sm:py-20 lg:px-16">
        <div className="mx-auto flex max-w-[1440px] flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Eyebrow>Start your project</Eyebrow>
            <h2 className="mt-4 max-w-4xl text-[clamp(2.75rem,6vw,6.5rem)] font-medium leading-[0.9] tracking-[-0.06em] text-[#101820]">
              Ready for a clearer plan?
            </h2>
            <p className="mt-7 max-w-2xl text-base leading-7 text-[#667584] sm:text-lg sm:leading-8">
              Tell us what you need or schedule a free on-site inspection. We’ll confirm the details before anything is fabricated.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/get-quote" className="inline-flex items-center gap-2 rounded-full bg-[#162d4a] px-6 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-[#2c5282]">
              Build my quote <ArrowRight className="h-4 w-4" />
            </Link>
            <a href="#booking" className="inline-flex items-center gap-2 rounded-full border border-[#b9cbd9] px-6 py-3.5 text-sm font-semibold text-[#2c5282] transition-colors hover:border-[#2c5282] hover:bg-white/60">
              Book an inspection
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
