"use client";

/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { Search } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import Footer from "@/components/landing/Footer";
import Navbar from "@/components/landing/Navbar";
import PublicPageHero from "@/components/landing/PublicPageHero";
import { PaginationControls, type PaginationMeta } from "@/components/ui/pagination-controls";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchCategories, fetchProducts } from "@/features/products/product-api";
import type { Category, Product } from "@/features/products/types";
import {
  formatCurrency,
  productCategories,
  productCover,
} from "@/features/products/product-utils";
import { isCatalogMode } from "@/lib/app-mode";

const gradients = [
  "linear-gradient(135deg,#1a2332,#2c5282)",
  "linear-gradient(135deg,#2c5282,#6a8fa8)",
  "linear-gradient(135deg,#4a7291,#9eb4c9)",
  "linear-gradient(135deg,#1a2332,#4a7291)",
  "linear-gradient(135deg,#162d4a,#2c5282)",
  "linear-gradient(135deg,#6a8fa8,#c8dae8)",
];

const CATALOG_SCROLL_PREFIX = "sog_products_scroll:";
const CATALOG_SCROLL_RETURN_KEY = "sog_products_scroll_return";

export default function PublicProductCatalog() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeCategory = searchParams.get("category_id") ?? "";
  const activeSearch = searchParams.get("q") ?? "";
  const requestedPage = Number(searchParams.get("page") ?? "1");
  const activePage = Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;
  const [products, setProducts] = useState<Product[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState(activeSearch);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const catalogQuery = searchParams.toString();
  const catalogHref = `/products${catalogQuery ? `?${catalogQuery}` : ""}`;
  const restoredCatalogHref = useRef<string | null>(null);

  useEffect(() => {
    let mounted = true;

    void Promise.resolve()
      .then(() => {
        if (mounted) setLoading(true);

        return Promise.all([
          fetchProducts({
            is_active: "1",
            per_page: "12",
            page: String(activePage),
            category_id: activeCategory,
            search: activeSearch,
          }),
          fetchCategories(),
        ]);
      })
      .then(([productsResponse, nextCategories]) => {
        if (!mounted) return;
        setProducts(productsResponse.data);
        setMeta(productsResponse.meta ?? null);
        setCategories(nextCategories);
        setError("");
      })
      .catch(() => {
        if (mounted) setError("Unable to load products. Please try again.");
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [activeCategory, activePage, activeSearch]);

  useEffect(() => {
    queueMicrotask(() => setSearch(activeSearch));
  }, [activeSearch]);

  const rememberCatalogScroll = useCallback(() => {
    sessionStorage.setItem(`${CATALOG_SCROLL_PREFIX}${catalogHref}`, String(window.scrollY));
    sessionStorage.setItem(CATALOG_SCROLL_RETURN_KEY, catalogHref);
  }, [catalogHref]);

  useEffect(() => {
    if (loading || restoredCatalogHref.current === catalogHref) return;

    restoredCatalogHref.current = catalogHref;

    if (sessionStorage.getItem(CATALOG_SCROLL_RETURN_KEY) !== catalogHref) return;

    const storedScroll = sessionStorage.getItem(`${CATALOG_SCROLL_PREFIX}${catalogHref}`);
    if (!storedScroll) return;

    const firstFrame = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        window.scrollTo({ top: Number(storedScroll) || 0, behavior: "instant" });
        sessionStorage.removeItem(CATALOG_SCROLL_RETURN_KEY);
      });
    });

    return () => cancelAnimationFrame(firstFrame);
  }, [catalogHref, loading]);

  const setProductQuery = (next: { categoryId?: number | null; search?: string; page?: number }) => {
    const params = new URLSearchParams(searchParams.toString());

    if ("categoryId" in next) {
      if (next.categoryId) params.set("category_id", String(next.categoryId));
      else params.delete("category_id");
    }

    if ("search" in next) {
      const term = next.search?.trim() ?? "";
      if (term) params.set("q", term);
      else params.delete("q");
    }

    if ("page" in next) {
      if (next.page && next.page > 1) params.set("page", String(next.page));
      else params.delete("page");
    } else if ("categoryId" in next || "search" in next) {
      params.delete("page");
    }

    router.replace(`/products${params.toString() ? `?${params.toString()}` : ""}`, {
      scroll: false,
    });
  };

  const setCategory = (categoryId: number | null) => {
    setProductQuery({ categoryId });
  };

  const setPage = (page: number) => {
    document.getElementById("product-results")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
    setProductQuery({ page });
  };

  const productHref = (productId: number) =>
    `/products/${productId}${catalogQuery ? `?${catalogQuery}` : ""}`;

  return (
    <div className="min-h-screen bg-white text-[#101820]">
      <Navbar />

      <PublicPageHero
        eyebrow="Product collection"
        title={<>Everything we craft,<br />built for your space.</>}
        description="Browse made-to-measure glass and aluminum systems for residential and commercial openings."
        aside={
          <div className="relative w-full lg:w-96">
              <input
                type="text"
                placeholder="Search products..."
                value={search}
                onChange={(event) => {
                  const nextSearch = event.target.value;
                  setSearch(nextSearch);
                  setProductQuery({ search: nextSearch });
                }}
                className="w-full rounded-full border border-white/20 bg-white/10 px-5 py-4 pr-12 text-sm text-white placeholder-white/45 outline-none backdrop-blur-md transition focus:border-white/50 focus:bg-white/15 focus:ring-2 focus:ring-white/20"
              />
              <Search className="absolute right-5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/55" />
          </div>
        }
      />

      <main className="py-2 sm:px-3 sm:py-3">
        <div className="mx-auto min-h-[36rem] max-w-none bg-white px-4 py-8 sm:rounded-[2rem] sm:bg-[#f3f6f8] sm:px-10 sm:py-20 lg:px-16">
          <div className="mx-auto max-w-[1440px]">
            {categories.length > 0 && (
            <div className="mb-10 flex flex-wrap gap-2 border-b border-[#dce4ea] pb-7 sm:mb-14">
              <button
                type="button"
                onClick={() => setCategory(null)}
                className={`rounded-full px-4 py-2 text-xs font-semibold transition-all ${
                  !activeCategory
                    ? "border border-[#162d4a] bg-[#162d4a] text-white"
                    : "border border-[#cbd6de] bg-white text-[#667584] hover:border-[#2c5282]"
                }`}
              >
                All
              </button>
              {categories.map((category) => {
                const active = activeCategory === String(category.id);
                return (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => setCategory(category.id)}
                    className={`rounded-full px-4 py-2 text-xs font-semibold transition-all ${
                      active
                        ? "border border-[#162d4a] bg-[#162d4a] text-white"
                        : "border border-[#cbd6de] bg-white text-[#667584] hover:border-[#2c5282]"
                    }`}
                  >
                    {category.name}
                  </button>
                );
              })}
            </div>
          )}
        {loading ? (
          <CatalogSkeleton />
        ) : error ? (
          <EmptyState title={error} body="Please refresh the page." />
        ) : products.length === 0 ? (
          <EmptyState title="No products found" body="Try a different search or category." />
        ) : (
          <>
            <p id="product-results" className="mb-7 scroll-mt-6 text-xs font-medium uppercase tracking-[0.16em] text-[#8996a2]">
              {meta?.total ?? products.length} product{(meta?.total ?? products.length) === 1 ? "" : "s"}
              {search ? ` for "${search}"` : ""}
            </p>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {products.map((product, index) => {
                const cover = productCover(product);
                const category = productCategories(product)[0];
                const gradient = gradients[index % gradients.length];

                return (
                  <article
                    key={product.id}
                    className="group block overflow-hidden rounded-[1.5rem] border border-[#dce4ea] bg-white no-underline transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_24px_70px_rgba(22,45,74,0.12)]"
                  >
                    <div
                      className="relative flex aspect-[4/3] items-center justify-center overflow-hidden"
                      style={{ background: cover ? "#f8fafc" : gradient }}
                    >
                      <Link
                        href={productHref(product.id)}
                        onClick={rememberCatalogScroll}
                        className="block h-full w-full"
                      >
                        {cover ? (
                          <img
                            src={cover}
                            alt={product.name}
                            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.025]"
                          />
                        ) : (
                          <span className="flex h-full w-full items-center justify-center text-[32px] font-black text-white opacity-30">
                            {product.name.slice(0, 2).toUpperCase()}
                          </span>
                        )}
                      </Link>
                    </div>

                    <div className="p-6">
                      {category && (
                        <span className="mb-3 inline-block text-[9px] font-bold uppercase tracking-[0.2em] text-[#608db9]">
                          {category.name}
                        </span>
                      )}
                      <h3 className="mb-2 text-xl font-medium leading-snug tracking-[-0.03em] text-[#101820]">
                        {product.name}
                      </h3>
                      <p className="mb-5 line-clamp-2 min-h-10 text-xs leading-5 text-[#667584]">
                        {product.description}
                      </p>
                      <div
                        className={`flex items-center gap-3 ${
                          isCatalogMode ? "justify-end" : "justify-between"
                        }`}
                      >
                        {!isCatalogMode && (
                          <span className="text-xs font-semibold text-[#2c5282]">
                            from {formatCurrency(product.price_per_unit)}
                            <span className="font-normal text-slate-400">
                              /{product.unit}
                            </span>
                          </span>
                        )}
                        <Link
                          href={productHref(product.id)}
                          onClick={rememberCatalogScroll}
                          className="inline-flex items-center rounded-full border border-[#dce4ea] px-3 py-2 text-[11px] font-semibold text-[#536372] transition-colors group-hover:border-[#2c5282] group-hover:text-[#2c5282]"
                        >
                          View →
                        </Link>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>

            {meta && meta.last_page > 1 && (
              <PaginationControls
                meta={meta}
                loading={loading}
                onPageChange={setPage}
                className="mt-8"
              />
            )}
          </>
        )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

function CatalogSkeleton() {
  return (
    <>
      <Skeleton className="mb-6 h-4 w-20" />
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 8 }, (_, index) => (
          <div
            key={index}
            className="overflow-hidden rounded-[1.5rem] border border-[#dce4ea] bg-white"
          >
            <Skeleton className="h-48 rounded-none" />
            <div className="space-y-3 p-4">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-5 w-3/5" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-4/5" />
              <div className="flex items-center justify-between pt-1">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-4 w-12" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-[1.5rem] border border-dashed border-[#cbd6de] bg-white px-6 py-24 text-center text-[#667584]">
      <p className="mb-2 text-xl font-medium tracking-[-0.025em] text-[#101820]">{title}</p>
      <p className="text-sm">{body}</p>
    </div>
  );
}
