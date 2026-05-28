"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

import type { Product } from "@/features/products/types";
import {
  productCategories,
  productCover,
} from "@/features/products/product-utils";
import { api } from "@/lib/api";
import Booking from "./Booking";
import Footer from "./Footer";
import Navbar from "./Navbar";

type ProductsResponse =
  | Product[]
  | { data?: Product[] }
  | { data?: { data?: Product[] } };

const gradients = [
  "linear-gradient(135deg,#1a2332,#2c5282)",
  "linear-gradient(135deg,#2c5282,#6a8fa8)",
  "linear-gradient(135deg,#4a7291,#608DB9)",
  "linear-gradient(135deg,#1a2332,#4a7291)",
  "linear-gradient(135deg,#162d4a,#2c5282)",
  "linear-gradient(135deg,#6a8fa8,#c8dae8)",
];

const faqs = [
  {
    question: "What types of glass do you use?",
    answer:
      "We use tempered, laminated, frosted, and clear float glass depending on the application. Our team recommends the best type based on safety requirements and aesthetic preferences.",
  },
  {
    question: "How long does fabrication and installation take?",
    answer:
      "Most orders are completed within 7-14 business days from measurement confirmation. Complex or large commercial orders may take 3-4 weeks.",
  },
  {
    question: "Is the on-site inspection really free?",
    answer:
      "Yes, completely free with zero obligation. Our technician visits, measures, and provides a detailed itemized quote at no charge.",
  },
  {
    question: "Do you service areas outside Metro Manila?",
    answer:
      "We currently serve Metro Manila, Cavite, Laguna, Bulacan, and Rizal. Contact us for areas beyond these.",
  },
  {
    question: "How does the AR preview work?",
    answer:
      "Open our AR tool on your mobile browser, point the camera at the wall or opening, and tap to place the 3D model. No app download required.",
  },
];

const stats = [
  {
    stat: "500+",
    desc: "Completed installations across the metro.",
  },
  {
    stat: "100%",
    desc: "Free on-site inspection with no hidden charges.",
  },
  {
    stat: "AR Ready",
    desc: "Visualize products in your actual space before buying.",
  },
  {
    stat: "5 stars",
    desc: "Rated for craftsmanship, speed, and support.",
  },
];

function fmt(n: number | string) {
  return Number(n).toLocaleString("en-PH", { minimumFractionDigits: 0 });
}

function extractProducts(response: ProductsResponse): Product[] {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response.data)) return response.data;
  if (Array.isArray(response.data?.data)) return response.data.data;
  return [];
}

function productImage(product: Product) {
  return productCover(product) || null;
}

export default function Welcome() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [productsError, setProductsError] = useState("");

  function openAr() {
    window.location.href = `${window.location.protocol}//${window.location.hostname}:5173/ar/v2`;
  }

  useEffect(() => {
    let mounted = true;

    api<ProductsResponse>("/api/v1/products?is_active=1&per_page=6", {
      skipAuth: true,
    })
      .then((response) => {
        if (mounted) setProducts(extractProducts(response));
      })
      .catch(() => {
        if (mounted) setProductsError("Products are unavailable right now.");
      });

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="overflow-x-hidden bg-white text-slate-900">
      <Navbar />

      <main
        id="home"
        className="mx-auto grid max-w-7xl items-center gap-10 px-4 pb-16 pt-10 sm:px-6 md:grid-cols-2 md:px-6 md:pb-28 md:pt-16 lg:px-8"
      >
        <div className="space-y-8">
          <div className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-1">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              Trusted Glass & Aluminum Specialists
            </span>
          </div>
          <h1 className="text-3xl font-bold leading-tight text-black sm:text-4xl md:text-5xl lg:text-6xl">
            Clear views,
            <br />
            <span className="text-secondary">built to last.</span>
          </h1>
          <p className="max-w-md text-base leading-relaxed text-slate-500 sm:text-lg">
            From custom windows and doors to aluminum racks and cabinets, SOG
            crafts precision-built solutions for every space. See it in your
            home before you buy, with live AR preview.
          </p>
          <div className="flex flex-col items-stretch gap-4 sm:flex-row sm:items-center">
            <a
              href="#booking"
              className="cursor-pointer rounded-xl bg-primary px-8 py-4 text-center text-sm font-bold text-white shadow-xl transition-all hover:-translate-y-0.5"
            >
              Get a Quote Now
            </a>
            <button
              type="button"
              onClick={openAr}
              className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-slate-200 px-8 py-4 text-sm font-bold text-primary transition-all hover:border-primary hover:bg-slate-50"
            >
              View in AR
            </button>
          </div>
          <div className="flex flex-wrap gap-3 pt-2 text-[10px] font-black uppercase tracking-widest text-slate-300 sm:text-[11px]">
            <span>Precision Crafted</span>
            <span>|</span>
            <span>AR Preview</span>
            <span>|</span>
            <span>Free Ocular Visit</span>
          </div>
        </div>

        <div className="group relative mt-10 md:mt-0">
          <div className="relative flex aspect-[4/5] w-full items-center justify-center overflow-hidden rounded-[2.5rem] bg-primary shadow-2xl">
            <Image
              src="/images/landing/windows.jpg"
              alt="SOG window installation"
              width={1200}
              height={1500}
              className="h-full w-full object-cover"
              priority
            />
          </div>
          <div className="absolute bottom-4 right-2 min-w-[180px] rounded-2xl bg-white/95 p-4 shadow-2xl backdrop-blur-xl transition-transform group-hover:scale-[1.02] sm:bottom-6 sm:right-4 sm:min-w-[220px] sm:p-6">
            <p className="mb-4 text-[10px] font-black uppercase tracking-widest text-slate-400">
              Your Quotes
            </p>
            <div className="space-y-3">
              {[
                { label: "Sliding Door", price: "PHP 18,500" },
                { label: "Aluminum Window", price: "PHP 8,200" },
                { label: "Glass Cabinet", price: "PHP 12,000" },
              ].map((quote, i) => (
                <div
                  key={quote.label}
                  className={`flex items-center justify-between ${
                    i < 2 ? "border-b border-slate-100 pb-2" : ""
                  }`}
                >
                  <span className="text-xs font-bold text-slate-800">
                    {quote.label}
                  </span>
                  <span className="text-xs font-black text-primary">
                    {quote.price}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div
            id="ar"
            className="landing-float absolute -left-2 top-3 flex items-center gap-2.5 rounded-xl bg-secondary px-3 py-2 text-xs font-bold text-white shadow-xl sm:-left-4 sm:top-5 sm:px-4 sm:py-3"
          >
            <div className="landing-pulse-dot h-2 w-2 rounded-full bg-green-400" />
            AR Preview Available
          </div>
        </div>
      </main>

      <section id="about" className="bg-slate-50 py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-8 md:px-12 lg:px-20">
          <div className="mb-16 grid gap-6 md:mb-24 md:grid-cols-2">
            <div className="relative flex min-h-[380px] flex-col items-center justify-center overflow-hidden rounded-[2.5rem] border border-slate-100 bg-white p-10">
              <span className="absolute top-6 rounded-full border border-secondary bg-white px-4 py-1 text-[10px] font-black uppercase tracking-widest text-secondary">
                Without SOG
              </span>
              <div className="mt-10 w-full max-w-xs space-y-3">
                {[
                  "Multiple contractors, no clear quote",
                  "Vague measurements, delays happen",
                  "Total guesswork on fit and material",
                ].map((text, i) => (
                  <div
                    key={text}
                    className={`flex items-center gap-3 rounded-xl bg-slate-50 p-4 text-xs text-slate-500 shadow-sm ${
                      i === 0 ? "-rotate-2" : i === 1 ? "rotate-1" : "-rotate-1"
                    }`}
                  >
                    {text}
                  </div>
                ))}
              </div>
            </div>
            <div className="relative flex min-h-[380px] flex-col items-center overflow-hidden rounded-[2.5rem] border border-slate-200 bg-[#f0f6fb80] p-10">
              <span className="absolute top-6 rounded-full bg-secondary px-4 py-1 text-[10px] font-black uppercase tracking-widest text-white">
                With SOG
              </span>
              <div className="mt-16 w-full max-w-sm space-y-4">
                {[
                  {
                    icon: "OK",
                    title: "Instant AR Visualization",
                    desc: "See it in your space before ordering",
                  },
                  {
                    icon: "CM",
                    title: "Precise On-Site Measurement",
                    desc: "Free inspection, itemized quote on the spot",
                  },
                ].map((item) => (
                  <div
                    key={item.title}
                    className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-white p-4 shadow-md"
                  >
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-primary">
                      {item.icon}
                    </div>
                    <div>
                      <p className="text-xs font-black uppercase text-slate-900">
                        {item.title}
                      </p>
                      <p className="text-xs text-slate-400">{item.desc}</p>
                    </div>
                  </div>
                ))}
                <div className="pt-4 text-center">
                  <div className="inline-block rounded-xl border border-slate-100 bg-white px-6 py-3 shadow-sm">
                    <p className="text-xs font-bold italic text-primary">
                      Zero guesswork. Total confidence.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mx-auto mb-10 max-w-3xl text-center md:mb-14">
            <h2 className="mb-5 text-2xl font-bold leading-tight text-secondary sm:text-3xl md:text-4xl lg:text-5xl">
              Guesswork and forgotten measurements
              <br />
              are holding your project back
            </h2>
            <p className="text-lg font-medium text-slate-500">
              We built a smarter way to buy glass and aluminum. More accurate,
              more transparent, and actually stress-free.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((item) => (
              <div
                key={item.stat}
                className="rounded-[2rem] border border-slate-100 bg-slate-50 p-8 transition-all duration-300 hover:border-blue-100 hover:bg-white hover:shadow-xl"
              >
                <p className="mb-2 text-3xl font-black text-secondary">
                  {item.stat}
                </p>
                <p className="text-sm font-medium leading-relaxed text-slate-500">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="overflow-hidden bg-white py-16 md:py-24">
        <div className="mx-auto max-w-7xl space-y-24 px-4 sm:px-8 md:space-y-36 md:px-12 lg:px-20">
          {[
            {
              title: "One shop for all\nyour glass needs",
              text: "Sliding doors, swing doors, windows, partitions, cabinets - all fabricated in-house by our skilled team.",
              image: "/images/landing/high-quality.png",
              alt: "Glass and aluminum work",
            },
            {
              title: "See it in your\nspace first.",
              text: "Point your phone at any wall or opening. Our AR tool lets you visualize how the window, door, or partition will look.",
              image: "/images/landing/aesthetic.jpg",
              alt: "Modern glass aesthetic",
              reverse: true,
            },
            {
              title: "We measure.\nYou decide.",
              text: "Our certified technicians visit your space, take precise measurements, and hand you a detailed itemized quote.",
              image: "/images/landing/workmanship.png",
              alt: "SOG workmanship",
            },
          ].map((feature) => (
            <div
              key={feature.title}
              className="grid items-center gap-10 md:grid-cols-2 md:gap-20"
            >
              <div className={`space-y-6 ${feature.reverse ? "md:order-2" : ""}`}>
                <h2 className="whitespace-pre-line text-4xl font-bold leading-tight tracking-tight text-secondary">
                  {feature.title}
                </h2>
                <p className="leading-relaxed text-slate-500">{feature.text}</p>
              </div>
              <div
                className={`relative flex aspect-square items-center justify-center overflow-hidden rounded-[2.5rem] bg-slate-50 shadow-inner ${
                  feature.reverse ? "md:order-1" : ""
                }`}
              >
                <Image
                  src={feature.image}
                  alt={feature.alt}
                  width={900}
                  height={900}
                  className="h-full w-full object-cover"
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section id="products" className="bg-slate-50 py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-8 md:px-12 lg:px-20">
          <div className="mb-10 flex flex-col items-start justify-between gap-4 md:mb-16 md:flex-row md:items-end">
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-primary">
                Our Products
              </span>
              <h2 className="mt-2 text-4xl font-bold tracking-tight text-secondary md:text-5xl">
                Crafted for every space.
              </h2>
              <p className="mt-4 text-lg text-slate-500">
                From sliding doors to glass partitions, built to your exact
                specs.
              </p>
            </div>
            <Link
              href="/products"
              className="whitespace-nowrap text-xs font-bold text-primary hover:underline"
            >
              View All Products →
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((product, i) => {
              const coverImage = productImage(product);
              const category = productCategories(product)[0];
              const gradient = gradients[i % gradients.length];

              return (
                <div
                  key={product.id}
                  className="cursor-pointer overflow-hidden rounded-[1.5rem] border border-slate-100 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                >
                  <div
                    className="flex h-52 items-center justify-center overflow-hidden bg-cover bg-center"
                    style={{
                      background: coverImage
                        ? `center / cover no-repeat url("${coverImage}")`
                        : gradient,
                    }}
                    role="img"
                    aria-label={product.name}
                  />

                  <div className="p-5">
                    {category && (
                      <span className="mb-2 inline-block rounded-md bg-blue-50 px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-primary">
                        {category.name}
                      </span>
                    )}
                    <h3 className="mb-1 font-bold text-slate-900">
                      {product.name}
                    </h3>
                    <p className="mb-2 line-clamp-2 text-xs leading-relaxed text-slate-500">
                      {product.description}
                    </p>
                    <p className="mb-4 text-xs font-bold text-primary">
                      from PHP {fmt(product.price_per_unit)}
                      <span className="font-normal text-slate-400">
                        /{product.unit}
                      </span>
                    </p>
                    <div className="flex gap-2">
                      <Link
                        href={`/products/${product.id}`}
                        className="rounded-lg bg-primary px-4 py-2 text-xs font-bold text-white transition-colors hover:opacity-90"
                      >
                        View More
                      </Link>
                      <Link
                        href={`/get-quote?product=${product.id}`}
                        className="rounded-lg border-2 border-slate-200 px-4 py-2 text-xs font-bold text-primary transition-colors hover:border-primary"
                      >
                        Get Quote
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}

            {products.length === 0 && (
              <div className="py-16 text-center text-slate-400 sm:col-span-2 lg:col-span-3">
                <p className="font-semibold">
                  {productsError || "No products available yet."}
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      <Booking />

      <section className="border-t border-slate-100 bg-slate-50 py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-8 md:px-12 lg:px-20">
          <div className="grid gap-10 md:grid-cols-2 md:gap-20">
            <div>
              <h2 className="text-2xl font-bold leading-tight tracking-tight text-secondary sm:text-5xl">
                Frequently
                <br className="hidden sm:block" />
                Asked
                <br />
                Questions
              </h2>
              <p className="mt-5 text-base text-slate-500">
                Can&apos;t find the answer?{" "}
                <a
                  href="#booking"
                  className="font-bold text-primary hover:underline"
                >
                  Contact our team →
                </a>
              </p>
            </div>
            <div className="space-y-0">
              {faqs.map((faq, index) => (
                <div key={faq.question} className="border-b border-slate-200">
                  <button
                    onClick={() =>
                      setOpenFaq(openFaq === index ? null : index)
                    }
                    className="flex w-full items-center justify-between px-2 py-6 text-left text-sm font-bold text-slate-900 transition-colors hover:text-primary"
                  >
                    {faq.question}
                    <span
                      className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border-2 text-xs transition-all"
                      style={{
                        background: openFaq === index ? "#608DB9" : "",
                        borderColor:
                          openFaq === index ? "#608DB9" : "#e2e8f0",
                        color: openFaq === index ? "white" : "#94a3b8",
                      }}
                    >
                      {openFaq === index ? "x" : "+"}
                    </span>
                  </button>
                  <div
                    className="overflow-hidden transition-all duration-300"
                    style={{ maxHeight: openFaq === index ? "200px" : "0" }}
                  >
                    <p className="px-2 pb-5 text-sm leading-relaxed text-slate-500">
                      {faq.answer}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
