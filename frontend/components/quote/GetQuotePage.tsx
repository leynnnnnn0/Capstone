"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import Footer from "@/components/landing/Footer";
import Navbar from "@/components/landing/Navbar";
import ProductConfigurator from "@/components/quote/ProductConfigurator";
import QuoteCart from "@/components/quote/QuoteCart";
import QuoteCheckoutForm from "@/components/quote/QuoteCheckoutForm";
import { fetchProducts } from "@/features/products/product-api";
import type { Product } from "@/features/products/types";
import { arHandoffToCartItems, parseArQuoteHandoff } from "@/features/quotes/ar-quote-handoff";
import type { QuoteCartItem } from "@/features/quotes/types";

export default function GetQuotePage() {
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<QuoteCartItem[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [showCheckout, setShowCheckout] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const preSelectedProductId = useMemo(() => numberParam(searchParams.get("product")), [searchParams]);
  const preSelectedVariantId = useMemo(() => numberParam(searchParams.get("variant")), [searchParams]);
  const arItemsParam = useMemo(() => searchParams.get("ar_items"), [searchParams]);
  const editingItem = editingIndex !== null ? cart[editingIndex] ?? null : null;

  useEffect(() => {
    let mounted = true;

    fetchProducts({ is_active: "1", per_page: "100" })
      .then((response) => {
        if (!mounted) return;
        setProducts(response.data);
        setError("");
        const arHandoff = parseArQuoteHandoff(arItemsParam);
        if (arHandoff) {
          const arCartItems = arHandoffToCartItems(arHandoff, response.data);
          if (arCartItems.length > 0) {
            setCart(arCartItems);
            setEditingIndex(null);
            setShowCheckout(true);
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
  }, [arItemsParam]);

  const addItem = (item: QuoteCartItem) => {
    setCart((current) => [...current, item]);
  };

  const updateItem = (item: QuoteCartItem) => {
    setCart((current) => current.map((cartItem, index) => (index === editingIndex ? item : cartItem)));
    setEditingIndex(null);
  };

  const removeItem = (indexToRemove: number) => {
    setCart((current) => current.filter((_, index) => index !== indexToRemove));
    if (editingIndex === indexToRemove) setEditingIndex(null);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <header className="bg-primary">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="mb-4 inline-flex rounded-lg bg-white/10 px-3 py-1">
            <span className="text-[10px] font-bold uppercase tracking-widest text-white/70">
              Free Inspection Included
            </span>
          </div>
          <h1 className="mb-2 text-[24px] font-extrabold leading-tight text-white sm:text-[34px]">
            Build your quote,
            <br />
            one product at a time.
          </h1>
          <p className="max-w-md text-[14px] text-white/65">
            Add as many products as you need in a single request.
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 pb-24 sm:px-6 lg:px-8 lg:pb-16">
        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-400">
            Loading quote builder...
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-red-500">
            {error}
          </div>
        ) : showCheckout ? (
          <QuoteCheckoutForm
            cart={cart}
            onBack={() => setShowCheckout(false)}
            onSuccess={() => {
              setCart([]);
              setEditingIndex(null);
            }}
          />
        ) : (
          <div className="flex flex-col items-start gap-6 lg:flex-row lg:gap-7">
            <ProductConfigurator
              products={products}
              preSelectedProductId={preSelectedProductId}
              preSelectedVariantId={preSelectedVariantId}
              editingItem={editingItem}
              onAdd={addItem}
              onUpdate={updateItem}
              onCancelEdit={() => setEditingIndex(null)}
            />
            <QuoteCart
              cart={cart}
              onEdit={setEditingIndex}
              onRemove={removeItem}
              onCheckout={() => setShowCheckout(true)}
            />
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

function numberParam(value: string | null) {
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}
