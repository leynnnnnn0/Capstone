"use client";

/* eslint-disable @next/next/no-img-element */

import type { ProductVariant } from "@/features/products/types";
import { formatCurrency, quoteVariantImage, variantLabel } from "@/features/quotes/quote-utils";

export default function VariantPicker({
  variants,
  selected,
  onSelect,
}: {
  variants: ProductVariant[];
  selected: ProductVariant | null;
  onSelect: (variant: ProductVariant | null) => void;
}) {
  if (variants.length === 0) return null;

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {variants.map((variant) => {
        const active = selected?.id === variant.id;
        const image = quoteVariantImage(variant);

        return (
          <button
            key={variant.id}
            type="button"
            onClick={() => onSelect(active ? null : variant)}
            className={`overflow-hidden rounded-xl border text-center transition-all ${
              active ? "border-primary bg-blue-50" : "border-slate-200 bg-white"
            }`}
          >
            {image && (
              <div className="h-16 overflow-hidden">
                <img src={image} alt={variantLabel(variant)} className="h-full w-full object-cover" />
              </div>
            )}
            <div className="p-2.5">
              <p className={`mb-0.5 text-[11px] font-bold leading-tight ${active ? "text-primary" : "text-slate-900"}`}>
                {variantLabel(variant)}
              </p>
              <p className="text-[13px] font-extrabold text-primary">
                {formatCurrency(variant.price)}
              </p>
            </div>
          </button>
        );
      })}
    </div>
  );
}
