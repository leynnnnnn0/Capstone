"use client";

/* eslint-disable @next/next/no-img-element */

import { Search } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import DimensionFields from "@/components/quote/DimensionFields";
import HistoryBackButton from "@/components/navigation/HistoryBackButton";
import LivePriceBar from "@/components/quote/LivePriceBar";
import OptionGroupPicker from "@/components/quote/OptionGroupPicker";
import QuoteProductCard from "@/components/quote/QuoteProductCard";
import VariantPicker from "@/components/quote/VariantPicker";
import type { Category, Product, ProductVariant } from "@/features/products/types";
import { productCategories as categoriesForProduct } from "@/features/products/product-utils";
import type { QuoteCartItem, QuoteDraft, SizeMode } from "@/features/quotes/types";
import {
  createQuoteDraft,
  createQuoteId,
  isQuoteDraftReady,
  productOptionGroups,
  productVariants,
  quoteProductImage,
} from "@/features/quotes/quote-utils";

export default function ProductConfigurator({
  products,
  categories = [],
  preSelectedProductId,
  preSelectedVariantId,
  editingItem,
  onAdd,
  onUpdate,
  onCancelEdit,
}: {
  products: Product[];
  categories?: Category[];
  preSelectedProductId: number | null;
  preSelectedVariantId: number | null;
  editingItem: QuoteCartItem | null;
  onAdd: (item: QuoteCartItem) => void;
  onUpdate: (item: QuoteCartItem) => void;
  onCancelEdit: () => void;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeCategory = searchParams.get("category_id") ?? "";
  const activeSearch = searchParams.get("q") ?? "";
  const initialProduct = products[0] ?? null;
  const [step, setStep] = useState<1 | 2>(preSelectedProductId || editingItem ? 2 : 1);
  const [search, setSearch] = useState(activeSearch);
  const [draft, setDraft] = useState<QuoteDraft | null>(() =>
    editingItem
      ? itemToDraft(editingItem)
      : initialProduct
        ? createQuoteDraft(initialProduct, preSelectedVariantId)
        : null,
  );

  useEffect(() => {
    if (editingItem) {
      queueMicrotask(() => {
        setDraft(itemToDraft(editingItem));
        setStep(2);
      });
      return;
    }

    const selectedProduct = preSelectedProductId
      ? products.find((product) => product.id === preSelectedProductId)
      : null;

    if (selectedProduct) {
      queueMicrotask(() => {
        setDraft(createQuoteDraft(selectedProduct, preSelectedVariantId));
        setStep(2);
      });
    } else if (initialProduct) {
      queueMicrotask(() => setDraft(createQuoteDraft(initialProduct)));
    }
  }, [editingItem, initialProduct, preSelectedProductId, preSelectedVariantId, products]);

  useEffect(() => {
    queueMicrotask(() => setSearch(activeSearch));
  }, [activeSearch]);

  const visibleProducts = useMemo(() => {
    const term = search.trim().toLowerCase();

    return products.filter((product) => {
      const matchesCategory =
        !activeCategory ||
        categoriesForProduct(product).some((category) => String(category.id) === activeCategory);
      const matchesSearch =
        !term ||
        `${product.name} ${product.description}`.toLowerCase().includes(term);

      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, products, search]);

  const ready = draft ? isQuoteDraftReady(draft) : false;
  const shouldUseHistoryBack = Boolean(preSelectedProductId || preSelectedVariantId);

  const setQuoteProductQuery = (next: { categoryId?: number | null; search?: string }) => {
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

    router.replace(`/get-quote${params.toString() ? `?${params.toString()}` : ""}`, {
      scroll: false,
    });
  };

  const pickProduct = (product: Product) => {
    setDraft(createQuoteDraft(product));
    setStep(2);
  };

  const selectVariant = (variant: ProductVariant | null) => {
    setDraft((current) =>
      current
        ? {
            ...current,
            variant,
            width: variant ? String(variant.width) : "",
            height: variant ? String(variant.height) : "",
          }
        : current,
    );
  };

  const submitDraft = () => {
    if (!draft || !ready) return;

    const item = {
      id: editingItem?.id ?? createQuoteId(),
      ...draft,
    };

    if (editingItem) onUpdate(item);
    else onAdd(item);

    if (!editingItem) {
      setStep(1);
      if (initialProduct) setDraft(createQuoteDraft(initialProduct));
    }
  };

  if (!draft) {
    return (
      <div className="min-w-0 flex-1 rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-400">
        No products are available for quotes yet.
      </div>
    );
  }

  if (step === 1) {
    return (
      <div className="min-w-0 flex-1">
        <div className="mb-7">
          <h2 className="mb-1.5 text-[22px] font-bold text-secondary sm:text-[28px]">
            {editingItem ? "Change product" : "Add a product"}
          </h2>
          <p className="text-[13px] text-slate-500 sm:text-[14px]">
            Select what you would like to include in your quote.
          </p>
        </div>

        <div className="mb-5 space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="relative">
            <input
              type="text"
              value={search}
              onChange={(event) => {
                const nextSearch = event.target.value;
                setSearch(nextSearch);
                setQuoteProductQuery({ search: nextSearch });
              }}
              placeholder="Search quote products..."
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 pr-10 text-[13px] text-slate-700 placeholder-slate-400 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
            <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          </div>

          {categories.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setQuoteProductQuery({ categoryId: null })}
                className={`rounded-full px-4 py-1.5 text-[12px] font-bold transition-all ${
                  !activeCategory
                    ? "border-2 border-primary bg-primary text-white"
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
                    onClick={() => setQuoteProductQuery({ categoryId: category.id })}
                    className={`rounded-full px-4 py-1.5 text-[12px] font-bold transition-all ${
                      active
                        ? "border-2 border-primary bg-primary text-white"
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

        {visibleProducts.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center text-sm font-semibold text-slate-400">
            No quote products match these filters.
          </div>
        ) : (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3">
          {visibleProducts.map((product, index) => (
            <QuoteProductCard
              key={product.id}
              product={product}
              index={index}
              onSelect={pickProduct}
            />
          ))}
        </div>
        )}

        {editingItem && (
          <button
            type="button"
            onClick={onCancelEdit}
            className="mt-4 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-[13px] font-bold text-slate-500 hover:bg-slate-50"
          >
            Cancel
          </button>
        )}
      </div>
    );
  }

  const variants = productVariants(draft.product);
  const hasVariants = variants.length > 0;
  const requiredGroups = productOptionGroups(draft.product).filter((group) => group.is_required);

  return (
    <div className="min-w-0 flex-1">
      <div className="mb-5 flex items-center gap-3">
        {shouldUseHistoryBack ? (
          <HistoryBackButton
            fallbackHref="/products"
            label="Back"
            className="rounded-lg bg-slate-100 px-3 py-1.5 text-[12px] font-bold text-slate-500 hover:bg-slate-200"
          />
        ) : (
          <button
            type="button"
            onClick={() => {
              setStep(1);
              if (!editingItem && initialProduct) setDraft(createQuoteDraft(initialProduct));
            }}
            className="rounded-lg bg-slate-100 px-3 py-1.5 text-[12px] font-bold text-slate-500 hover:bg-slate-200"
          >
            Back
          </button>
        )}
        {editingItem && (
          <span className="ml-auto rounded-lg bg-blue-50 px-3 py-1 text-[11px] font-bold text-primary">
            Editing item
          </span>
        )}
      </div>

      <div className="mb-5 flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3 sm:gap-4">
        <ProductIdentity product={draft.product} />
      </div>

      <OptionGroupPicker
        product={draft.product}
        selected={draft.selected_options}
        onChange={(selectedOptions) =>
          setDraft((current) => current && { ...current, selected_options: selectedOptions })
        }
      />

      <section className="mb-5">
        <p className="mb-2.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">
          Size
        </p>

        {hasVariants && (
          <div className="mb-3 flex flex-wrap gap-2">
            {[
              { key: "standard" as SizeMode, label: "Standard Sizes" },
              { key: "custom" as SizeMode, label: "Custom Dimensions" },
            ].map((mode) => (
              <button
                key={mode.key}
                type="button"
                onClick={() =>
                  setDraft((current) =>
                    current && {
                      ...current,
                      size_mode: mode.key,
                      variant: null,
                      width: "",
                      height: "",
                    },
                  )
                }
                className={`rounded-xl border px-4 py-2 text-[12px] font-bold transition-all ${
                  draft.size_mode === mode.key
                    ? "border-primary bg-primary text-white"
                    : "border-slate-200 bg-white text-slate-500"
                }`}
              >
                {mode.label}
              </button>
            ))}
          </div>
        )}

        {draft.size_mode === "standard" && hasVariants ? (
          <VariantPicker variants={variants} selected={draft.variant} onSelect={selectVariant} />
        ) : (
          <DimensionFields
            product={draft.product}
            value={{
              width: draft.width,
              height: draft.height,
              thickness: draft.thickness,
            }}
            onChange={(dims) => setDraft((current) => current && { ...current, ...dims })}
            unit={draft.dimension_unit ?? "m"}
            onUnitChange={(dimensionUnit) =>
              setDraft((current) =>
                current && { ...current, dimension_unit: dimensionUnit },
              )
            }
          />
        )}
      </section>

      <section className="mb-5">
        <LivePriceBar
          item={draft}
          onPiecesChange={(pieces) => setDraft((current) => current && { ...current, pieces })}
        />
      </section>

      <div className="flex gap-3">
        {editingItem && (
          <button
            type="button"
            onClick={onCancelEdit}
            className="rounded-xl border border-slate-200 bg-white px-5 py-3.5 text-[13px] font-bold text-slate-500 hover:bg-slate-50"
          >
            Cancel
          </button>
        )}
        <button
          type="button"
          onClick={submitDraft}
          disabled={!ready}
          className={`flex-1 rounded-xl py-3.5 text-[14px] font-bold transition-all ${
            ready ? "bg-primary text-white" : "bg-slate-200 text-slate-400"
          }`}
        >
          {editingItem ? "Update Item" : "+ Add to Quote"}
        </button>
      </div>

      {!ready && (
        <p className="mt-2 text-center text-[11px] text-slate-400">
          {requiredGroups.length > 0
            ? "Select required options and size to continue."
            : "Choose or enter a size to continue."}
        </p>
      )}
    </div>
  );
}

function itemToDraft(item: QuoteCartItem): QuoteDraft {
  return {
    product: item.product,
    selected_options: item.selected_options,
    size_mode: item.size_mode,
    dimension_unit: item.dimension_unit ?? "m",
    variant: item.variant,
    width: item.width,
    height: item.height,
    thickness: item.thickness,
    pieces: item.pieces,
  };
}

function ProductIdentity({ product }: { product: Product }) {
  const image = quoteProductImage(product);

  return (
    <>
      {image ? (
        <img src={image} alt={product.name} className="h-12 w-12 flex-shrink-0 rounded-xl object-cover" />
      ) : (
        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-primary">
          <span className="text-[11px] font-bold text-white/80">
            {product.name.slice(0, 2).toUpperCase()}
          </span>
        </div>
      )}
      <div className="min-w-0">
        <p className="truncate text-[15px] font-bold text-slate-900 sm:text-[16px]">{product.name}</p>
        <p className="line-clamp-1 text-[11px] text-slate-500 sm:text-[12px]">
          {product.description}
        </p>
      </div>
    </>
  );
}
