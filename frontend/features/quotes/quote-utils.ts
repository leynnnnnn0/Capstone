import type { Product, ProductVariant } from "@/features/products/types";
import {
  formatCurrency,
  optionGroupOptions,
  productImages,
  productOptionGroups,
  productVariants,
  variantImages,
  imageUrl,
} from "@/features/products/product-utils";
import type { QuoteCartItem, QuoteDraft, QuoteItemPayload, SelectedQuoteOption } from "./types";

export function createQuoteId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`;
}

export function parseNumber(value: string | number | null | undefined) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function createQuoteDraft(product: Product, variantId?: number | null): QuoteDraft {
  const variants = productVariants(product);
  const initialVariant =
    variantId ? variants.find((variant) => variant.id === variantId) ?? null : null;
  const sizeMode = variants.length > 0 ? "standard" : "custom";

  return {
    product,
    selected_options: [],
    size_mode: sizeMode,
    variant: initialVariant,
    width: initialVariant ? String(initialVariant.width) : "",
    height: initialVariant ? String(initialVariant.height) : "",
    thickness: "",
    pieces: 1,
  };
}

export function isQuoteDraftReady(draft: QuoteDraft) {
  const requiredGroups = productOptionGroups(draft.product).filter((group) => group.is_required);
  const allRequiredSelected = requiredGroups.every((group) =>
    draft.selected_options.some((option) => option.product_option_group_id === group.id),
  );

  if (!allRequiredSelected) return false;

  if (draft.size_mode === "standard" && productVariants(draft.product).length > 0) {
    return Boolean(draft.variant);
  }

  if (draft.product.unit === "sqm") {
    return parseNumber(draft.width) > 0 && parseNumber(draft.height) > 0;
  }

  if (draft.product.unit === "meter") return parseNumber(draft.width) > 0;

  return true;
}

export function computeOptionsAmount(options: SelectedQuoteOption[]) {
  return options.reduce((sum, option) => sum + Number(option.price_modifier), 0);
}

export function computeItemTotal(item: QuoteDraft | QuoteCartItem) {
  const optionsAmount = computeOptionsAmount(item.selected_options);

  if (item.size_mode === "standard" && item.variant) {
    return (Number(item.variant.price) + optionsAmount) * item.pieces;
  }

  const pricePerUnit = Number(item.product.price_per_unit);
  const width = parseNumber(item.width);
  const height = parseNumber(item.height);
  const measure =
    item.product.unit === "sqm" ? width * height : item.product.unit === "meter" ? width : 1;

  return (pricePerUnit + optionsAmount) * measure * item.pieces;
}

export function computeAmountPerPiece(item: QuoteDraft | QuoteCartItem) {
  return computeItemTotal(item) / Math.max(item.pieces, 1);
}

export function cartItemToPayload(item: QuoteCartItem): QuoteItemPayload {
  const amountPerPiece = computeAmountPerPiece(item);

  return {
    product_id: item.product.id,
    name: item.product.name,
    description: item.product.description,
    width: parseNumber(item.width) || null,
    height: parseNumber(item.height) || null,
    thickness: parseNumber(item.thickness) || null,
    pieces: item.pieces,
    amount_per_piece: amountPerPiece,
    options_amount: computeOptionsAmount(item.selected_options),
    total_amount: amountPerPiece * item.pieces,
    notes: "",
    selected_options: item.selected_options,
  };
}

export function quoteTotal(items: QuoteCartItem[]) {
  return items.reduce((sum, item) => sum + computeItemTotal(item), 0);
}

export function toggleQuoteOption(
  selected: SelectedQuoteOption[],
  groupId: number,
  optionId: number,
  product: Product,
) {
  const group = productOptionGroups(product).find((item) => item.id === groupId);
  const option = group ? optionGroupOptions(group).find((item) => item.id === optionId) : null;
  if (!group || !option) return selected;

  const existing = selected.find((item) => item.product_option_group_id === group.id);
  if (existing?.product_option_id === option.id && !group.is_required) {
    return selected.filter((item) => item.product_option_group_id !== group.id);
  }

  return [
    ...selected.filter((item) => item.product_option_group_id !== group.id),
    {
      product_option_group_id: group.id,
      product_option_id: option.id,
      group_name: group.name,
      option_name: option.name,
      price_modifier: Number(option.price_modifier),
    },
  ];
}

export function quoteProductImage(product: Product) {
  const image = productImages(product)[0];
  return image ? imageUrl(image) : "";
}

export function quoteVariantImage(variant: ProductVariant) {
  const image = variantImages(variant)[0];
  return image ? imageUrl(image) : "";
}

export function variantLabel(variant: ProductVariant) {
  return `${variant.width} x ${variant.height} cm`;
}

export { formatCurrency, optionGroupOptions, productOptionGroups, productVariants };
