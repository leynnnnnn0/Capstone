import type { Product } from "@/features/products/types";
import { optionGroupOptions, productOptionGroups, productVariants } from "@/features/products/product-utils";
import type { CustomerQuotationItem } from "@/features/customer/types";
import {
  computeMeasuredQuantity,
  dimensionValueInMeters,
  isQuantityOnlyUnit,
} from "@/features/quotes/quote-utils";
import type { DimensionUnit, QuoteItemPayload, SelectedQuoteOption } from "@/features/quotes/types";

export type AdminLineItem = {
  id: string;
  server_id?: number;
  product_id: string;
  name: string;
  description: string;
  width: string;
  height: string;
  thickness: string;
  dimension_unit: DimensionUnit;
  selected_variant_id?: string;
  pieces: string;
  amount_per_piece: string;
  options_amount: string;
  total_amount: string;
  notes: string;
  selected_options: SelectedQuoteOption[];
};

export function makeAdminLineItem(): AdminLineItem {
  return {
    id: crypto.randomUUID(),
    product_id: "",
    name: "",
    description: "",
    width: "",
    height: "",
    thickness: "",
    dimension_unit: "m",
    selected_variant_id: undefined,
    pieces: "1",
    amount_per_piece: "",
    options_amount: "0",
    total_amount: "0",
    notes: "",
    selected_options: [],
  };
}

export function customerItemToLineItem(item: CustomerQuotationItem, product?: Product | null): AdminLineItem {
  const matchingVariant = product
    ? productVariants(product).find((variant) =>
        dimensionsMatchVariant(item.width, variant.width) &&
        dimensionsMatchVariant(item.height, variant.height) &&
        Number(variant.price) === Number(item.amount_per_piece),
      )
    : null;

  return {
    id: crypto.randomUUID(),
    server_id: item.id,
    product_id: item.product_id ? String(item.product_id) : "",
    name: item.name,
    description: item.description ?? "",
    width: item.width ? String(item.width) : "",
    height: item.height ? String(item.height) : "",
    thickness: item.thickness ? String(item.thickness) : "",
    dimension_unit: matchingVariant ? "cm" : "m",
    selected_variant_id: matchingVariant ? String(matchingVariant.id) : undefined,
    pieces: String(item.pieces),
    amount_per_piece: String(item.amount_per_piece),
    options_amount: String(item.options_amount),
    total_amount: String(item.total_amount),
    notes: item.notes ?? "",
    selected_options: (item.options ?? []).map((option) => ({
      product_option_group_id: option.product_option_group_id,
      product_option_id: option.product_option_id,
      group_name: option.group_name,
      option_name: option.option_name,
      price_modifier: Number(option.price_modifier),
    })),
  };
}

export function customerItemsToLineItems(items: CustomerQuotationItem[], products: Product[]) {
  return items.map((item) =>
    customerItemToLineItem(
      item,
      products.find((product) => product.id === item.product_id) ?? null,
    ),
  );
}

export function lineItemToPayload(item: AdminLineItem): QuoteItemPayload {
  return {
    product_id: Number(item.product_id),
    name: item.name,
    description: item.description,
    width: dimensionValueOrNull(item.width, item.dimension_unit),
    height: dimensionValueOrNull(item.height, item.dimension_unit),
    thickness: toNumberOrNull(item.thickness),
    pieces: Number(item.pieces || 1),
    amount_per_piece: Number(item.amount_per_piece || 0),
    options_amount: Number(item.options_amount || 0),
    total_amount: Number(item.total_amount || 0),
    notes: item.notes,
    selected_options: item.selected_options,
  };
}

export function recalculateLineItem(item: AdminLineItem, updates: Partial<AdminLineItem>, product?: Product | null) {
  const merged = { ...item, ...updates };
  const width = dimensionValueInMeters(merged.width, merged.dimension_unit);
  const height = dimensionValueInMeters(merged.height, merged.dimension_unit);
  const pieces = Number(merged.pieces || 1);
  const optionsAmount = Number(merged.options_amount || 0);
  let amountPerPiece = Number(merged.amount_per_piece || 0);

  if (product && !isQuantityOnlyUnit(product.unit) && updates.amount_per_piece === undefined) {
    const selectedVariant = merged.selected_variant_id
      ? productVariants(product).find((variant) => String(variant.id) === merged.selected_variant_id)
      : null;

    if (selectedVariant) {
      amountPerPiece = Number(selectedVariant.price || 0);
    } else {
      const measuredQuantity = computeMeasuredQuantity(product.unit, width, height);

      if (measuredQuantity > 0) {
        amountPerPiece = measuredQuantity * Number(product.price_per_unit || 0);
      }
    }

    merged.amount_per_piece = amountPerPiece.toFixed(2);
  }

  return {
    ...updates,
    amount_per_piece: merged.amount_per_piece,
    options_amount: merged.options_amount,
    total_amount: ((amountPerPiece + optionsAmount) * pieces).toFixed(2),
  };
}

export function selectProductDefaults(product: Product): Partial<AdminLineItem> {
  return {
    product_id: String(product.id),
    name: product.name,
    description: "",
    width: "",
    height: "",
    thickness: "",
    dimension_unit: "m",
    selected_variant_id: undefined,
    amount_per_piece: "",
    options_amount: "0",
    total_amount: "0",
    selected_options: [],
  };
}

export function selectVariantDefaults(item: AdminLineItem, product: Product, variantId: string) {
  const variant = productVariants(product).find((candidate) => String(candidate.id) === variantId);
  if (!variant) return {};

  return recalculateLineItem(item, {
    width: String(variant.width),
    height: String(variant.height),
    dimension_unit: "cm",
    selected_variant_id: String(variant.id),
    amount_per_piece: String(variant.price),
  }, product);
}

export function updateSelectedOption(item: AdminLineItem, product: Product, groupId: number, optionId: string) {
  const group = productOptionGroups(product).find((candidate) => candidate.id === groupId);
  if (!group) return {};

  const selectedOptions = item.selected_options.filter((option) => option.product_option_group_id !== group.id);

  if (optionId !== "__none__") {
    const option = optionGroupOptions(group).find((candidate) => String(candidate.id) === optionId);
    if (option) {
      selectedOptions.push({
        product_option_group_id: group.id,
        product_option_id: option.id,
        group_name: group.name,
        option_name: option.name,
        price_modifier: Number(option.price_modifier),
      });
    }
  }

  const optionsAmount = selectedOptions.reduce((sum, option) => sum + Number(option.price_modifier), 0);

  return recalculateLineItem(item, {
    selected_options: selectedOptions,
    options_amount: optionsAmount.toFixed(2),
  }, product);
}

export function fmtPeso(value: number | string) {
  return Number(value || 0).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function validateLineItems(items: AdminLineItem[]) {
  const errors: Record<string, string> = {};
  if (items.length === 0) errors.items = "At least one item is required.";

  items.forEach((item, index) => {
    if (!item.product_id) errors[`items.${index}.product_id`] = "Product is required.";
    if (!item.name.trim()) errors[`items.${index}.name`] = "Item name is required.";
    if (!item.pieces || Number(item.pieces) < 1) errors[`items.${index}.pieces`] = "At least 1 piece required.";
  });

  return errors;
}

function toNumberOrNull(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && value !== "" ? parsed : null;
}

function dimensionValueOrNull(value: string, unit: DimensionUnit) {
  if (value === "") return null;

  const parsed = dimensionValueInMeters(value, unit);
  return Number.isFinite(parsed) ? parsed : null;
}

function dimensionsMatchVariant(savedValue: string | number | null | undefined, variantValue: string | number) {
  const saved = Number(savedValue);
  const variantCentimeters = Number(variantValue);
  const variantMeters = variantCentimeters / 100;

  return (
    Number.isFinite(saved) &&
    Number.isFinite(variantCentimeters) &&
    (Math.abs(saved - variantCentimeters) < 0.001 || Math.abs(saved - variantMeters) < 0.001)
  );
}
