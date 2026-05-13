"use client";

/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import type React from "react";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import Footer from "@/components/landing/Footer";
import Navbar from "@/components/landing/Navbar";
import { fetchProduct, fetchProducts } from "@/features/products/product-api";
import type { Product, ProductImage, ProductVariant } from "@/features/products/types";
import {
  formatCurrency,
  imageUrl,
  optionGroupOptions,
  productCategories,
  productImages,
  productOptionGroups,
  productVariants,
  variantImages,
} from "@/features/products/product-utils";

const gradients = [
  "linear-gradient(135deg,#1a2332,#2c5282)",
  "linear-gradient(135deg,#2c5282,#6a8fa8)",
  "linear-gradient(135deg,#4a7291,#608DB9)",
];

export default function PublicProductShow() {
  const params = useParams<{ product: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [related, setRelated] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!params.product) return;
    let mounted = true;

    fetchProduct(params.product)
      .then(async (nextProduct) => {
        if (!mounted) return;
        setProduct(nextProduct);

        const category = productCategories(nextProduct)[0];
        const relatedResponse = await fetchProducts({
          is_active: "1",
          per_page: "4",
          category_id: category ? String(category.id) : undefined,
        });

        if (mounted) {
          setRelated(
            relatedResponse.data
              .filter((item) => item.id !== nextProduct.id)
              .slice(0, 3),
          );
        }
      })
      .catch(() => {
        if (mounted) setError("Unable to load this product.");
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [params.product]);

  if (loading) {
    return (
      <Shell>
        <div className="mx-auto max-w-7xl px-4 py-24 text-center text-slate-400">
          Loading product...
        </div>
      </Shell>
    );
  }

  if (error || !product) {
    return (
      <Shell>
        <div className="mx-auto max-w-7xl px-4 py-24 text-center text-slate-400">
          {error || "Product not found."}
        </div>
      </Shell>
    );
  }

  const categories = productCategories(product);
  const optionGroups = productOptionGroups(product);
  const variants = productVariants(product);

  return (
    <Shell>
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        <div className="grid grid-cols-1 items-start gap-10 lg:grid-cols-2 lg:gap-20">
          <div className="order-1 lg:sticky lg:top-24 lg:order-2">
            <ImageGallery images={productImages(product)} productName={product.name} />
          </div>

          <div className="order-2 lg:order-1">
            {categories[0] && (
              <div className="mb-3 flex items-center gap-2 text-[11px] text-slate-400">
                <Link href="/products" className="font-semibold transition-colors hover:text-primary">
                  {categories[0].name}
                </Link>
                <span>/</span>
                <span className="text-slate-600">{product.name}</span>
              </div>
            )}

            <h1 className="mb-4 text-3xl font-bold leading-tight text-slate-900 sm:text-4xl">
              {product.name}
            </h1>

            <div className="mb-5 flex items-baseline gap-3">
              <span className="text-[26px] font-extrabold text-primary sm:text-[30px]">
                {formatCurrency(product.price_per_unit)}
              </span>
              <span className="text-[13px] text-slate-400">per {product.unit}</span>
            </div>

            <p className="mb-6 text-[14px] leading-relaxed text-slate-500 sm:text-[15px]">
              {product.description}
            </p>

            {optionGroups.length > 0 && (
              <div className="mb-6 space-y-4">
                {optionGroups.map((group) => (
                  <div key={group.id}>
                    <p className="mb-2 text-[11px] font-bold uppercase tracking-widest text-slate-400">
                      {group.name}
                      {group.is_required && <span className="ml-1.5 text-primary">*</span>}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {optionGroupOptions(group).map((option) => (
                        <span
                          key={option.id}
                          className="rounded-full border border-slate-200 px-3 py-1 text-[12px] font-semibold text-slate-600"
                        >
                          {option.name}
                          {Number(option.price_modifier) > 0 && (
                            <span className="ml-1 font-bold text-primary">
                              +{formatCurrency(option.price_modifier)}
                            </span>
                          )}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="mb-8 flex flex-wrap gap-2 border-b border-slate-100 pb-6">
              {["Fabricated In-House", "Warranty Included", "Free Measurement", "7-14 Day Lead Time"].map((label) => (
                <span
                  key={label}
                  className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-1.5 text-[11px] font-semibold text-slate-600"
                >
                  {label}
                </span>
              ))}
            </div>

            <div className="mb-6 flex flex-col gap-3 sm:flex-row">
              <Link
                href={`/get-quote?product=${product.id}`}
                className="flex-1 rounded-xl bg-primary py-4 text-center text-[14px] font-bold text-white no-underline transition-all hover:-translate-y-0.5 hover:opacity-90"
              >
                Get a Quote for This Product
              </Link>
            </div>

            <p className="text-center text-[11px] leading-relaxed text-slate-400">
              Free 3-5 day scheduling · Tool-free consultation · No obligation quote
            </p>
          </div>
        </div>
      </main>

      {variants.length > 0 && (
        <section className="border-t border-slate-100 bg-slate-50 py-12 sm:py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-8">
              <span className="mb-2 block text-[10px] font-black uppercase tracking-widest text-primary">
                Standard Sizes
              </span>
              <h2 className="text-2xl font-bold text-secondary sm:text-3xl">
                Available in {variants.length} standard size{variants.length === 1 ? "" : "s"}
              </h2>
              <p className="mt-2 text-[13px] text-slate-500">
                Need a custom size?{" "}
                <Link href="/get-quote" className="font-bold text-primary hover:underline">
                  Request a custom quote →
                </Link>
              </p>
            </div>

            <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
              <div className="hidden grid-cols-[auto_1fr_auto] gap-4 border-b border-slate-100 bg-slate-50/60 px-6 py-3 sm:grid">
                <span className="w-20 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Preview
                </span>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Specification
                </span>
                <span className="text-right text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Price & Action
                </span>
              </div>

              <div className="divide-y divide-slate-50 px-4 sm:px-6">
                {variants.map((variant) => (
                  <VariantRow
                    key={variant.id}
                    variant={variant}
                    productName={product.name}
                    productId={product.id}
                  />
                ))}
              </div>

              <div className="flex flex-col items-start justify-between gap-3 border-t border-slate-100 bg-slate-50 px-4 py-4 sm:flex-row sm:items-center sm:px-6">
                <div>
                  <p className="text-[13px] font-bold text-slate-700">Need a different size?</p>
                  <p className="text-[11px] text-slate-400">
                    We fabricate fully custom dimensions. Our technician will measure on-site.
                  </p>
                </div>
                <Link
                  href="/get-quote"
                  className="rounded-xl border-2 border-slate-200 px-5 py-2.5 text-[12px] font-bold whitespace-nowrap text-slate-600 no-underline transition-all hover:border-primary hover:text-primary"
                >
                  Custom Size Quote →
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      {related.length > 0 && (
        <section className="border-t border-slate-100 py-12 sm:py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-8 flex items-end justify-between">
              <div>
                <span className="mb-2 block text-[10px] font-black uppercase tracking-widest text-primary">
                  You May Also Like
                </span>
                <h2 className="text-2xl font-bold text-secondary">Related Products</h2>
              </div>
              <Link href="/products" className="text-[12px] font-bold text-primary hover:underline">
                View All →
              </Link>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((item, index) => (
                <RelatedProductCard key={item.id} product={item} index={index} />
              ))}
            </div>
          </div>
        </section>
      )}
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      <Navbar />
      {children}
      <Footer />
    </div>
  );
}

function ImageGallery({ images, productName }: { images: ProductImage[]; productName: string }) {
  const [active, setActive] = useState(0);
  const [zoomed, setZoomed] = useState(false);

  const normalizedImages = useMemo(
    () => images.map((image) => ({ ...image, src: imageUrl(image) })).filter((image) => image.src),
    [images],
  );

  if (normalizedImages.length === 0) {
    return (
      <div className="flex aspect-square w-full items-center justify-center rounded-3xl bg-primary">
        <span className="text-[48px] font-black text-white opacity-20">
          {productName.slice(0, 2).toUpperCase()}
        </span>
      </div>
    );
  }

  const current = normalizedImages[active] ?? normalizedImages[0];

  return (
    <div className="flex flex-col gap-4">
      <div
        className="relative aspect-square w-full cursor-zoom-in overflow-hidden rounded-3xl border border-slate-100 bg-slate-50"
        onClick={() => setZoomed(true)}
      >
        <img
          src={current.src}
          alt={productName}
          className="h-full w-full object-contain p-4 transition-all duration-500 sm:p-8"
        />

        {normalizedImages.length > 1 && (
          <>
            <div className="absolute right-4 top-4 flex items-baseline gap-1">
              <span className="text-[20px] font-black text-slate-900">
                {String(active + 1).padStart(2, "0")}
              </span>
              <span className="text-[14px] font-medium text-slate-400">
                / {String(normalizedImages.length).padStart(2, "0")}
              </span>
            </div>
            <GalleryButton side="left" onClick={() => setActive((currentIndex) => (currentIndex - 1 + normalizedImages.length) % normalizedImages.length)} />
            <GalleryButton side="right" onClick={() => setActive((currentIndex) => (currentIndex + 1) % normalizedImages.length)} />
          </>
        )}
      </div>

      {normalizedImages.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {normalizedImages.map((image, index) => (
            <button
              key={image.id}
              type="button"
              onClick={() => setActive(index)}
              className={`h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl border-2 transition-all sm:h-20 sm:w-20 ${
                active === index ? "border-primary" : "border-slate-200"
              }`}
            >
              <img
                src={image.src}
                alt={`${productName} view ${index + 1}`}
                className="h-full w-full object-cover"
              />
            </button>
          ))}
        </div>
      )}

      {zoomed && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setZoomed(false)}
        >
          <img
            src={current.src}
            alt={productName}
            className="max-h-full max-w-full rounded-2xl object-contain"
            onClick={(event) => event.stopPropagation()}
          />
          <button
            type="button"
            className="absolute right-5 top-5 text-2xl text-white"
            onClick={() => setZoomed(false)}
          >
            <X className="h-7 w-7" />
          </button>
        </div>
      )}
    </div>
  );
}

function GalleryButton({ side, onClick }: { side: "left" | "right"; onClick: () => void }) {
  const Icon = side === "left" ? ChevronLeft : ChevronRight;

  return (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation();
        onClick();
      }}
      className={`absolute top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-slate-100 bg-white text-slate-500 shadow-md transition hover:text-slate-900 ${
        side === "left" ? "left-3" : "right-3"
      }`}
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}

function VariantRow({
  variant,
  productName,
  productId,
}: {
  variant: ProductVariant;
  productName: string;
  productId: number;
}) {
  const image = variantImages(variant)[0];
  const src = image ? imageUrl(image) : "";

  return (
    <div className="flex items-center gap-4 border-b border-slate-100 py-4 last:border-0">
      <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl border border-slate-100 bg-slate-50 sm:h-20 sm:w-20">
        {src ? (
          <img src={src} alt={variantLabel(variant)} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-primary">
            <span className="text-[10px] font-bold text-white opacity-60">
              {String(variant.width)}
            </span>
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="mb-0.5 text-[13px] font-bold text-slate-900 sm:text-[14px]">
          {productName}
        </p>
        <p className="mb-1 text-[11px] text-slate-400">
          Size: <span className="font-semibold text-slate-600">{variantLabel(variant)}</span>
        </p>
      </div>

      <div className="flex flex-shrink-0 flex-col items-end gap-2">
        <p className="text-[12px] font-extrabold text-primary sm:text-[18px]">
          {formatCurrency(variant.price)}
        </p>
        <Link
          href={`/get-quote?product=${productId}&variant=${variant.id}`}
          className="rounded-xl bg-primary px-2 py-1 text-[8px] font-bold whitespace-nowrap text-white no-underline transition-all hover:-translate-y-0.5 hover:opacity-90 sm:px-4 sm:text-[12px]"
        >
          Request Quote
        </Link>
      </div>
    </div>
  );
}

function RelatedProductCard({ product, index }: { product: Product; index: number }) {
  const cover = productImages(product)[0];
  const src = cover ? imageUrl(cover) : "";

  return (
    <Link
      href={`/products/${product.id}`}
      className="group block overflow-hidden rounded-2xl border border-slate-100 bg-white no-underline shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
    >
      <div
        className="flex h-40 items-center justify-center overflow-hidden"
        style={{ background: src ? "#f8fafc" : gradients[index % gradients.length] }}
      >
        {src ? (
          <img
            src={src}
            alt={product.name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <span className="text-[28px] font-black text-white opacity-20">
            {product.name.slice(0, 2).toUpperCase()}
          </span>
        )}
      </div>
      <div className="p-4">
        <h3 className="mb-1 font-bold text-slate-900">{product.name}</h3>
        <p className="mb-2 line-clamp-1 text-[11px] text-slate-400">
          {product.description}
        </p>
        <p className="text-[12px] font-bold text-primary">
          from {formatCurrency(product.price_per_unit)}
          <span className="font-normal text-slate-400">/{product.unit}</span>
        </p>
      </div>
    </Link>
  );
}

function variantLabel(variant: ProductVariant) {
  return `${variant.width} x ${variant.height} cm`;
}
