"use client";

import Link from "next/link";
import { FileText, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { usePublicQuoteCart } from "@/features/quotes/public-quote-cart";
import type { QuoteCartItem } from "@/features/quotes/types";
import {
  computeItemTotal,
  formatCurrency,
  quoteTotal,
  variantLabel,
} from "@/features/quotes/quote-utils";
import { cn } from "@/lib/utils";

export default function PublicQuoteSheet({
  className,
  onNavigate,
}: {
  className?: string;
  onNavigate?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const { cart, hydrated, removeItem } = usePublicQuoteCart();
  const itemCount = cart.length;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`Open quote${itemCount ? ` with ${itemCount} items` : ""}`}
        className={cn(
          "relative inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-primary transition-all hover:-translate-y-0.5 hover:border-primary hover:bg-blue-50",
          className,
        )}
      >
        <FileText className="h-5 w-5" />
        {hydrated && itemCount > 0 && (
          <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-black text-white shadow">
            {itemCount > 99 ? "99+" : itemCount}
          </span>
        )}
      </button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="w-full gap-0 p-0 sm:max-w-md">
          <SheetHeader className="border-b border-slate-100 px-5 py-5 text-left">
            <SheetTitle className="flex items-center gap-2 text-lg font-bold text-slate-900">
              <FileText className="h-5 w-5 text-primary" />
              Your Quote
            </SheetTitle>
            <SheetDescription>
              Saved on this device while you browse products.
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-5 py-3">
            {!hydrated || cart.length === 0 ? (
              <div className="py-16 text-center text-slate-400">
                <p className="mb-1 text-sm font-semibold">No quotation items yet</p>
                <p className="text-xs">Configure a product to start your quote.</p>
              </div>
            ) : (
              cart.map((item) => (
                <div key={item.id} className="border-b border-slate-100 py-4 last:border-0">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-slate-900">{item.product.name}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        {measurementLabel(item)}
                      </p>
                      <p className="mt-1 text-xs text-slate-400">
                        {item.pieces} pc{item.pieces === 1 ? "" : "s"}
                      </p>
                    </div>
                    <p className="whitespace-nowrap text-sm font-extrabold text-primary">
                      {formatCurrency(Math.round(computeItemTotal(item)))}
                    </p>
                  </div>

                  {item.selected_options.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {item.selected_options.map((option) => (
                        <span
                          key={option.product_option_id}
                          className="rounded bg-blue-50 px-1.5 py-0.5 text-[10px] font-semibold text-primary"
                        >
                          {option.option_name}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="mt-3 flex gap-3">
                    <Link
                      href={`/get-quote?edit=${encodeURIComponent(item.id)}`}
                      onClick={() => {
                        setOpen(false);
                        onNavigate?.();
                      }}
                      className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Edit
                    </Link>
                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      className="inline-flex items-center gap-1 text-xs font-bold text-red-600 hover:underline"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Remove
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <SheetFooter className="border-t border-slate-100 bg-slate-50 px-5 py-4">
            {cart.length > 0 && (
              <div className="mb-2 flex items-baseline justify-between">
                <span className="text-sm font-semibold text-slate-500">Estimated Total</span>
                <span className="text-xl font-extrabold text-primary">
                  {formatCurrency(Math.round(quoteTotal(cart)))}
                </span>
              </div>
            )}
            <Link
              href="/get-quote"
              onClick={() => {
                setOpen(false);
                onNavigate?.();
              }}
              className="rounded-xl bg-primary px-4 py-3 text-center text-sm font-bold text-white transition-opacity hover:opacity-90"
            >
              {cart.length > 0 ? "Continue Quote" : "Start a Quote"}
            </Link>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  );
}

function measurementLabel(item: QuoteCartItem) {
  if (item.size_mode === "standard" && item.variant) {
    return variantLabel(item.variant);
  }

  if (!item.width) return "Custom measurement";
  return item.product.unit === "sqm"
    ? `${item.width}m x ${item.height}m`
    : `${item.width}m`;
}
