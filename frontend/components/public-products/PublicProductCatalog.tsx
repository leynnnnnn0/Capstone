"use client";

/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { Search } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import Footer from "@/components/landing/Footer";
import Navbar from "@/components/landing/Navbar";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchCategories, fetchProducts } from "@/features/products/product-api";
import type { Category, Product } from "@/features/products/types";
import {
  formatCurrency,
  productCategories,
  productCover,
} from "@/features/products/product-utils";

const gradients = [
  "linear-gradient(135deg,#1a2332,#2c5282)",
  "linear-gradient(135deg,#2c5282,#6a8fa8)",
  "linear-gradient(135deg,#4a7291,#9eb4c9)",
  "linear-gradient(135deg,#1a2332,#4a7291)",
  "linear-gradient(135deg,#162d4a,#2c5282)",
  "linear-gradient(135deg,#6a8fa8,#c8dae8)",
];

export default function PublicProductCatalog() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeCategory = searchParams.get("category_id") ?? "";
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    Promise.all([
      fetchProducts({
        is_active: "1",
        per_page: "100",
        category_id: activeCategory,
      }),
      fetchCategories(),
    ])
      .then(([productsResponse, nextCategories]) => {
        if (!mounted) return;
        setProducts(productsResponse.data);
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
  }, [activeCategory]);

  const filteredProducts = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return products;

    return products.filter((product) => {
      const haystack = `${product.name} ${product.description}`.toLowerCase();
      return haystack.includes(term);
    });
  }, [products, search]);

  const setCategory = (categoryId: number | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (categoryId) params.set("category_id", String(categoryId));
    else params.delete("category_id");
    router.push(`/products${params.toString() ? `?${params.toString()}` : ""}`);
  };

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <Navbar />

      <header className="bg-primary">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div>
              <div className="mb-4 inline-flex rounded-lg bg-white/10 px-3 py-1">
                <span className="text-[10px] font-bold uppercase tracking-widest text-white/70">
                  Catalog
                </span>
              </div>
              <h1 className="text-2xl font-extrabold leading-tight text-white sm:text-4xl">
                Everything we craft,
                <br className="hidden sm:block" /> built for your space.
              </h1>
            </div>

            <div className="relative w-full sm:w-80">
              <input
                type="text"
                placeholder="Search products..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 pr-10 text-[13px] text-slate-700 placeholder-slate-400 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
              <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            </div>
          </div>

          {categories.length > 0 && (
            <div className="mt-6 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setCategory(null)}
                className={`rounded-full px-4 py-1.5 text-[12px] font-bold transition-all ${
                  !activeCategory
                    ? "border-2 border-[#9eb4c9] bg-[#9eb4c9] text-white"
                    : "border border-slate-200 bg-white text-slate-500"
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
                    className={`rounded-full px-4 py-1.5 text-[12px] font-bold transition-all ${
                      active
                        ? "border-2 border-[#9eb4c9] bg-[#9eb4c9] text-white"
                        : "border border-slate-200 bg-white text-slate-500"
                    }`}
                  >
                    {category.name}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-12 pb-24 sm:px-6 lg:px-8">
        {loading ? (
          <CatalogSkeleton />
        ) : error ? (
          <EmptyState title={error} body="Please refresh the page." />
        ) : filteredProducts.length === 0 ? (
          <EmptyState title="No products found" body="Try a different search or category." />
        ) : (
          <>
            <p className="mb-6 text-[12px] font-medium text-slate-400">
              {filteredProducts.length} product{filteredProducts.length === 1 ? "" : "s"}
              {search ? ` for "${search}"` : ""}
            </p>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredProducts.map((product, index) => {
                const cover = productCover(product);
                const category = productCategories(product)[0];
                const gradient = gradients[index % gradients.length];

                return (
                  <article
                    key={product.id}
                    className="group block overflow-hidden rounded-2xl border border-slate-100 bg-white no-underline shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                  >
                    <div
                      className="relative flex h-48 items-center justify-center overflow-hidden"
                      style={{ background: cover ? "#f8fafc" : gradient }}
                    >
                      <Link href={`/products/${product.id}`} className="block h-full w-full">
                        {cover ? (
                          <img
                            src={cover}
                            alt={product.name}
                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                        ) : (
                          <span className="flex h-full w-full items-center justify-center text-[32px] font-black text-white opacity-30">
                            {product.name.slice(0, 2).toUpperCase()}
                          </span>
                        )}
                      </Link>
                    </div>

                    <div className="p-4">
                      {category && (
                        <span className="mb-2 inline-block rounded bg-blue-50 px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-primary">
                          {category.name}
                        </span>
                      )}
                      <h3 className="mb-1 font-bold leading-snug text-slate-900">
                        {product.name}
                      </h3>
                      <p className="mb-3 line-clamp-2 text-[11px] leading-relaxed text-slate-400">
                        {product.description}
                      </p>
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-[12px] font-bold text-primary">
                          from {formatCurrency(product.price_per_unit)}
                          <span className="font-normal text-slate-400">
                            /{product.unit}
                          </span>
                        </span>
                        <Link
                          href={`/products/${product.id}`}
                          className="text-[11px] font-bold text-slate-400 transition-colors group-hover:text-primary"
                        >
                          View →
                        </Link>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}

function CatalogSkeleton() {
  return (
    <>
      <Skeleton className="mb-6 h-4 w-20" />
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }, (_, index) => (
          <div
            key={index}
            className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm"
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
    <div className="py-24 text-center text-slate-400">
      <p className="mb-2 text-lg font-semibold">{title}</p>
      <p className="text-sm">{body}</p>
    </div>
  );
}
