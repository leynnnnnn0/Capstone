"use client";

/* eslint-disable @next/next/no-img-element */

import type { Product } from "@/features/products/types";
import { formatCurrency, quoteProductImage } from "@/features/quotes/quote-utils";

const gradients = [
  "linear-gradient(135deg,#1a2332,#2c5282)",
  "linear-gradient(135deg,#2c5282,#6a8fa8)",
  "linear-gradient(135deg,#4a7291,#608DB9)",
  "linear-gradient(135deg,#1a2332,#4a7291)",
  "linear-gradient(135deg,#162d4a,#2c5282)",
  "linear-gradient(135deg,#0f2440,#3b6fa0)",
];

export default function QuoteProductCard({
  product,
  index,
  onSelect,
}: {
  product: Product;
  index: number;
  onSelect: (product: Product) => void;
}) {
  const image = quoteProductImage(product);

  return (
    <button
      type="button"
      onClick={() => onSelect(product)}
      className="group overflow-hidden rounded-2xl border border-slate-200 bg-white text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary hover:shadow-lg"
    >
      <div
        className="flex h-24 items-center justify-center overflow-hidden sm:h-28"
        style={{ background: image ? "#f8fafc" : gradients[index % gradients.length] }}
      >
        {image ? (
          <img src={image} alt={product.name} className="h-full w-full object-cover" />
        ) : (
          <span className="text-xl font-black text-white/40">
            {product.name.slice(0, 2).toUpperCase()}
          </span>
        )}
      </div>
      <div className="p-3">
        <p className="mb-1 text-[13px] font-bold leading-tight text-slate-900">
          {product.name}
        </p>
        <p className="mb-2 hidden line-clamp-2 text-[11px] leading-relaxed text-slate-500 sm:block">
          {product.description}
        </p>
        <p className="text-[11px] font-bold text-primary">
          from {formatCurrency(product.price_per_unit)}
          <span className="font-normal text-slate-400">/{product.unit}</span>
        </p>
      </div>
    </button>
  );
}
