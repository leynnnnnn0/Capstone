"use client";

import { useState } from "react";

import type { QuoteCartItem } from "@/features/quotes/types";
import {
  computeItemTotal,
  formatCurrency,
  quoteTotal,
  variantLabel,
} from "@/features/quotes/quote-utils";

export default function QuoteCart({
  cart,
  onEdit,
  onRemove,
  onCheckout,
}: {
  cart: QuoteCartItem[];
  onEdit: (index: number) => void;
  onRemove: (index: number) => void;
  onCheckout: () => void;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const total = quoteTotal(cart);

  const content = (
    <>
      <div className="max-h-[min(380px,50vh)] overflow-y-auto px-4 py-2">
        {cart.length === 0 ? (
          <div className="py-8 text-center text-slate-400">
            <p className="mb-1 text-[12px] font-semibold">No items yet</p>
            <p className="text-[11px]">Configure a product to start.</p>
          </div>
        ) : (
          cart.map((item, index) => (
            <div key={item.id} className="border-b border-slate-50 py-2.5 last:border-0">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="text-[12px] font-bold text-slate-900">{item.product.name}</p>
                  {item.size_mode === "standard" && item.variant ? (
                    <p className="mb-1 text-[10px] font-semibold text-primary">
                      {variantLabel(item.variant)}
                    </p>
                  ) : item.width ? (
                    <p className="mb-1 text-[10px] text-slate-400">
                      {item.product.unit === "sqm"
                        ? `${item.width}m x ${item.height}m`
                        : `${item.width}m`}
                    </p>
                  ) : null}
                  {item.selected_options.length > 0 && (
                    <div className="mb-1 flex flex-wrap gap-1">
                      {item.selected_options.map((option) => (
                        <span key={option.product_option_id} className="rounded bg-blue-50 px-1.5 py-0.5 text-[9px] font-semibold text-primary">
                          {option.option_name}
                        </span>
                      ))}
                    </div>
                  )}
                  <p className="text-[10px] text-slate-400">
                    {item.pieces} pc{item.pieces === 1 ? "" : "s"}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[13px] font-extrabold text-primary">
                    {formatCurrency(Math.round(computeItemTotal(item)))}
                  </p>
                  <div className="mt-1 flex justify-end gap-2">
                    <button type="button" onClick={() => { onEdit(index); setMobileOpen(false); }} className="text-[10px] font-bold text-primary hover:underline">
                      Edit
                    </button>
                    <button type="button" onClick={() => onRemove(index)} className="text-[10px] font-bold text-red-600 hover:underline">
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {cart.length > 0 && (
        <div className="border-t border-slate-100 px-4 py-4">
          <div className="mb-3 flex items-baseline justify-between">
            <span className="text-[12px] font-semibold text-slate-500">Estimated Total</span>
            <span className="text-[18px] font-extrabold text-primary">
              {formatCurrency(Math.round(total))}
            </span>
          </div>
          <button
            type="button"
            onClick={() => { onCheckout(); setMobileOpen(false); }}
            className="w-full rounded-xl bg-primary py-3.5 text-[13px] font-bold text-white hover:opacity-90"
          >
            Request Inspection →
          </button>
          <p className="mt-2 text-center text-[10px] leading-relaxed text-slate-400">
            Final price confirmed after free on-site visit.
          </p>
        </div>
      )}
    </>
  );

  return (
    <>
      <aside className="sticky top-24 hidden w-72 flex-shrink-0 self-start lg:block xl:w-80">
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between bg-primary px-5 py-4">
            <span className="text-[14px] font-bold text-white">Your Quote</span>
            {cart.length > 0 && (
              <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-[11px] font-bold text-white">
                {cart.length} item{cart.length === 1 ? "" : "s"}
              </span>
            )}
          </div>
          {content}
        </div>
      </aside>

      <div className="lg:hidden">
        {cart.length > 0 && (
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="fixed bottom-5 right-4 z-40 flex items-center gap-2.5 rounded-2xl bg-primary px-4 py-3 text-[13px] font-bold text-white shadow-2xl"
          >
            <span>{cart.length} item{cart.length === 1 ? "" : "s"}</span>
            <span className="opacity-70">·</span>
            <span>{formatCurrency(Math.round(total))}</span>
          </button>
        )}

        {mobileOpen && (
          <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/45" onClick={(event) => {
            if (event.target === event.currentTarget) setMobileOpen(false);
          }}>
            <div className="max-h-[85vh] overflow-hidden rounded-t-3xl bg-white shadow-2xl">
              <div className="flex items-center justify-between bg-primary px-5 py-4">
                <span className="text-[14px] font-bold text-white">Your Quote</span>
                <button type="button" onClick={() => setMobileOpen(false)} className="text-xl leading-none text-white/80">
                  x
                </button>
              </div>
              {content}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
