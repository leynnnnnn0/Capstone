"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import Footer from "@/components/landing/Footer";
import Navbar from "@/components/landing/Navbar";
import PublicPageHero from "@/components/landing/PublicPageHero";
import ProductConfigurator from "@/components/quote/ProductConfigurator";
import QuoteCart from "@/components/quote/QuoteCart";
import QuoteCheckoutForm from "@/components/quote/QuoteCheckoutForm";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchCategories, fetchProducts } from "@/features/products/product-api";
import type { Category, Product } from "@/features/products/types";
import { arHandoffToCartItems, parseArQuoteHandoff } from "@/features/quotes/ar-quote-handoff";
import {
  reconcileQuoteCart,
  usePublicQuoteCart,
} from "@/features/quotes/public-quote-cart";
import type { QuoteCartItem } from "@/features/quotes/types";

export default function GetQuotePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [showCheckout, setShowCheckout] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const {
    cart,
    hydrated,
    setCart,
    removeItem: removeCartItem,
    clearCart,
  } = usePublicQuoteCart();

  const preSelectedProductId = useMemo(() => numberParam(searchParams.get("product")), [searchParams]);
  const preSelectedVariantId = useMemo(() => numberParam(searchParams.get("variant")), [searchParams]);
  const preSelectedSizeMode = searchParams.get("size") === "custom" ? "custom" : null;
  const arItemsParam = useMemo(() => searchParams.get("ar_items"), [searchParams]);
  const editingItemId = useMemo(() => searchParams.get("edit"), [searchParams]);
  const editingItem = editingIndex !== null ? cart[editingIndex] ?? null : null;

  useEffect(() => {
    if (!hydrated) return;
    let mounted = true;

    // The quote page always loads active products first. If AR sent measurements
    // through the ar_items query parameter, those measurements are converted into
    // cart items after the products are available for product lookup/pricing.
    Promise.all([
      fetchProducts({ is_active: "1", per_page: "100" }),
      fetchCategories().catch(() => []),
    ])
      .then(([response, nextCategories]) => {
        if (!mounted) return;
        setProducts(response.data);
        setCategories(nextCategories);
        setCart((current) => reconcileQuoteCart(current, response.data));
        setError("");
        const arHandoff = parseArQuoteHandoff(arItemsParam);
        if (arHandoff) {
          const arCartItems = arHandoffToCartItems(arHandoff, response.data);
          if (arCartItems.length > 0) {
            setCart(arCartItems);
            setEditingIndex(null);
            setShowCheckout(true);
            const nextParams = new URLSearchParams(searchParams.toString());
            nextParams.delete("ar_items");
            router.replace(
              `/get-quote${nextParams.toString() ? `?${nextParams}` : ""}`,
              { scroll: false },
            );
          } else {
            setError("AR measurements were received, but no matching quote products were found.");
          }
        }
      })
      .catch(() => {
        if (mounted) setError("Unable to load quote products.");
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [arItemsParam, hydrated, router, searchParams, setCart]);

  useEffect(() => {
    if (!editingItemId) return;
    const index = cart.findIndex((item) => item.id === editingItemId);
    queueMicrotask(() => setEditingIndex(index >= 0 ? index : null));
  }, [cart, editingItemId]);

  const addItem = (item: QuoteCartItem) => {
    // Normal quote-builder path: append one configured product to the cart.
    setCart((current) => [...current, item]);
  };

  const updateItem = (item: QuoteCartItem) => {
    // Editing keeps the item in the same cart position so checkout order stays stable.
    setCart((current) => current.map((cartItem, index) => (index === editingIndex ? item : cartItem)));
    setEditingIndex(null);
    clearEditParam();
  };

  const removeItem = (indexToRemove: number) => {
    // Removing the edited item should also close edit mode.
    const item = cart[indexToRemove];
    if (!item) return;
    removeCartItem(item.id);
    if (editingIndex === indexToRemove) {
      setEditingIndex(null);
      clearEditParam();
    }
  };

  const cancelEdit = () => {
    setEditingIndex(null);
    clearEditParam();
  };

  function clearEditParam() {
    if (!searchParams.has("edit")) return;

    const params = new URLSearchParams(searchParams.toString());
    params.delete("edit");
    router.replace(`/get-quote${params.toString() ? `?${params}` : ""}`);
  }

  return (
    <div className="min-h-screen bg-white text-[#101820]">
      <Navbar />

      <PublicPageHero
        eyebrow="Free inspection included"
        title={<>Build your quote,<br />one product at a time.</>}
        description="Configure the products your project needs. Dimensions and options stay together in one clear request."
        aside={
          <div className="grid grid-cols-3 gap-2 rounded-[1.5rem] border border-white/15 bg-white/[0.08] p-4 backdrop-blur-md sm:min-w-80">
            {["Choose", "Configure", "Submit"].map((label, index) => (
              <div key={label} className="text-center">
                <span className="mx-auto flex h-8 w-8 items-center justify-center rounded-full border border-white/20 text-[10px] font-semibold">0{index + 1}</span>
                <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-white/60">{label}</p>
              </div>
            ))}
          </div>
        }
      />

      <main className="py-2 sm:px-3 sm:py-3">
        <div className="mx-auto max-w-none bg-white px-4 py-8 sm:rounded-[2rem] sm:bg-[#f3f6f8] sm:px-8 sm:py-16 lg:px-12 lg:py-20">
          <div className="mx-auto max-w-[1440px]">
        {loading ? (
          <QuoteBuilderSkeleton />
        ) : error ? (
          <div className="rounded-[1.5rem] border border-red-200 bg-white p-10 text-center text-red-600">
            {error}
          </div>
        ) : showCheckout ? (
          <QuoteCheckoutForm
            cart={cart}
            onRemove={removeCartItem}
            onBack={() => setShowCheckout(false)}
            onSuccess={() => {
              clearCart();
              setEditingIndex(null);
            }}
          />
        ) : (
          <div className="flex w-full flex-col items-stretch gap-7 lg:flex-row lg:items-start lg:gap-8">
            <ProductConfigurator
              products={products}
              categories={categories}
            preSelectedProductId={preSelectedProductId}
            preSelectedVariantId={preSelectedVariantId}
            preSelectedSizeMode={preSelectedSizeMode}
            editingItem={editingItem}
            onAdd={addItem}
              onUpdate={updateItem}
              onCancelEdit={cancelEdit}
            />
            <QuoteCart
              cart={cart}
              onEdit={setEditingIndex}
              onRemove={removeItem}
              onCheckout={() => setShowCheckout(true)}
            />
          </div>
        )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

function QuoteBuilderSkeleton() {
  return (
    <div className="flex flex-col items-start gap-7 lg:flex-row lg:gap-8">
      <div className="w-full space-y-5 rounded-[1.5rem] border border-[#dce4ea] bg-white p-5 lg:flex-1 sm:p-7">
        <Skeleton className="h-6 w-44" />
        <Skeleton className="h-11 w-full rounded-xl" />
        <div className="grid gap-4 sm:grid-cols-2">
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
        </div>
        <Skeleton className="h-11 w-full rounded-xl" />
        <Skeleton className="h-11 w-full rounded-xl" />
        <Skeleton className="h-12 w-full rounded-xl" />
      </div>
      <div className="w-full space-y-4 rounded-[1.5rem] border border-[#dce4ea] bg-white p-5 lg:w-80 sm:p-6">
        <Skeleton className="h-6 w-28" />
        <Skeleton className="h-20 w-full rounded-xl" />
        <Skeleton className="h-20 w-full rounded-xl" />
        <Skeleton className="h-12 w-full rounded-xl" />
      </div>
    </div>
  );
}

function numberParam(value: string | null) {
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}
