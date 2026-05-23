"use client";

import { useState } from "react";
import Image from "next/image";
import { ImageIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { CustomerQuotation, CustomerQuotationItem } from "@/features/customer/types";
import type { Product, ProductImage, ResourceCollection } from "@/features/products/types";

export default function CustomerQuoteImageList({
  quotation,
}: {
  quotation?: CustomerQuotation | null;
}) {
  const [showAllItems, setShowAllItems] = useState(false);
  const items = quotation?.items ?? [];

  if (!quotation || items.length === 0) return null;

  const visibleItems = showAllItems ? items : items.slice(0, 1);

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="mb-4 text-xs font-semibold uppercase tracking-widest text-primary">
        Quotation Items
      </h2>
      <div className="grid gap-3 sm:grid-cols-2">
        {visibleItems.map((item) => (
          <QuoteImageItem key={item.id} item={item} />
        ))}
      </div>
      {items.length > 1 && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-3 h-8 w-full text-xs"
          onClick={() => setShowAllItems((value) => !value)}
        >
          {showAllItems ? "Show Less" : `Show All ${items.length} Items`}
        </Button>
      )}
    </section>
  );
}

function QuoteImageItem({ item }: { item: CustomerQuotationItem }) {
  const image = productImage(item.product);
  const beforeImages = item.before_images ?? [];
  const afterImages = item.after_images ?? [];
  const photoCount = beforeImages.length + afterImages.length;

  return (
    <article className="overflow-hidden rounded-lg border border-slate-200 bg-white">
      <div className="relative h-32 bg-slate-100">
        {image ? (
          <Image src={image} alt={item.name} fill unoptimized className="object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-slate-400">
            No product image
          </div>
        )}
      </div>
      <div className="p-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="line-clamp-1 text-sm font-medium text-slate-950">{item.name}</p>
            <p className="mt-1 text-xs text-slate-500">
              {[item.width && item.height ? `${item.width} x ${item.height} cm` : null, `${item.pieces} pc`]
                .filter(Boolean)
                .join(" · ")}
            </p>
          </div>
          <Badge variant="outline" className="shrink-0 text-[10px] font-medium">
            {formatItemStatus(item.status)}
          </Badge>
        </div>
        <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
          <ImageIcon className="size-3.5" />
          {photoCount} before/after photo{photoCount === 1 ? "" : "s"}
        </div>
      </div>
    </article>
  );
}

function formatItemStatus(status?: string | null) {
  if (!status) return "For Acceptance";

  return status
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function productImage(product?: Product | null) {
  if (!product) return null;
  if (product.cover_image) return product.cover_image;

  return firstImage(product.images) ?? firstImage(product.product_images);
}

function firstImage(collection?: ResourceCollection<ProductImage>) {
  const images = Array.isArray(collection) ? collection : collection?.data;
  const image = images?.[0];

  return image?.image_url ?? image?.url ?? null;
}
