"use client";

import { NativeShimmerImage } from "@/components/ui/shimmer-image";
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
      className="group flex h-full flex-col overflow-hidden rounded-[1.25rem] border border-[#dce4ea] bg-white text-left transition-all hover:-translate-y-1 hover:border-[#608db9] hover:shadow-[0_20px_50px_rgba(22,45,74,0.10)]"
    >
      <div
        className="flex aspect-[4/3] items-center justify-center overflow-hidden"
        style={{ background: image ? "#f8fafc" : gradients[index % gradients.length] }}
      >
        {image ? (
          <NativeShimmerImage
            src={image}
            alt={product.name}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.025]"
          />
        ) : (
          <span className="text-xl font-black text-white/40">
            {product.name.slice(0, 2).toUpperCase()}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <p className="mb-1.5 line-clamp-2 text-sm font-semibold leading-snug text-[#101820]">
          {product.name}
        </p>
        <p className="mb-3 hidden text-[11px] leading-5 text-slate-500 sm:line-clamp-2">
          {product.description}
        </p>
        <p className="mt-auto text-[11px] font-semibold text-[#2c5282]">
          from {formatCurrency(product.price_per_unit)}
          <span className="font-normal text-slate-400">/{product.unit}</span>
        </p>
      </div>
    </button>
  );
}
