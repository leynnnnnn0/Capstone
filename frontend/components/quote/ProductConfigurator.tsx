"use client";

/* eslint-disable @next/next/no-img-element */

import { useEffect, useState } from "react";

import DimensionFields from "@/components/quote/DimensionFields";
import LivePriceBar from "@/components/quote/LivePriceBar";
import OptionGroupPicker from "@/components/quote/OptionGroupPicker";
import QuoteProductCard from "@/components/quote/QuoteProductCard";
import VariantPicker from "@/components/quote/VariantPicker";
import type { Product, ProductVariant } from "@/features/products/types";
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
  preSelectedProductId,
  preSelectedVariantId,
  editingItem,
  onAdd,
  onUpdate,
  onCancelEdit,
}: {
  products: Product[];
  preSelectedProductId: number | null;
  preSelectedVariantId: number | null;
  editingItem: QuoteCartItem | null;
  onAdd: (item: QuoteCartItem) => void;
  onUpdate: (item: QuoteCartItem) => void;
  onCancelEdit: () => void;
}) {
  const initialProduct = products[0] ?? null;
  const [step, setStep] = useState<1 | 2>(preSelectedProductId || editingItem ? 2 : 1);
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

  const ready = draft ? isQuoteDraftReady(draft) : false;

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

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3">
          {products.map((product, index) => (
            <QuoteProductCard
              key={product.id}
              product={product}
              index={index}
              onSelect={pickProduct}
            />
          ))}
        </div>

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
        <button
          type="button"
          onClick={() => {
            setStep(1);
            if (!editingItem && initialProduct) setDraft(createQuoteDraft(initialProduct));
          }}
          className="rounded-lg bg-slate-100 px-3 py-1.5 text-[12px] font-bold text-slate-500 hover:bg-slate-200"
        >
          ← Products
        </button>
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
