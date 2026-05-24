import type { Product } from "@/features/products/types";
import { optionGroupOptions, productOptionGroups, productVariants } from "@/features/products/product-utils";
import type { CustomerQuotationItem } from "@/features/customer/types";
import type { QuoteItemPayload, SelectedQuoteOption } from "@/features/quotes/types";

export type AdminLineItem = {
  id: string;
  server_id?: number;
  product_id: string;
  name: string;
  description: string;
  width: string;
  height: string;
  thickness: string;
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
    pieces: "1",
    amount_per_piece: "",
    options_amount: "0",
    total_amount: "0",
    notes: "",
    selected_options: [],
  };
}

export function customerItemToLineItem(item: CustomerQuotationItem): AdminLineItem {
  return {
    id: crypto.randomUUID(),
    server_id: item.id,
    product_id: item.product_id ? String(item.product_id) : "",
    name: item.name,
    description: item.description ?? "",
    width: item.width ? String(item.width) : "",
    height: item.height ? String(item.height) : "",
    thickness: item.thickness ? String(item.thickness) : "",
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

export function lineItemToPayload(item: AdminLineItem): QuoteItemPayload {
  return {
    product_id: Number(item.product_id),
    name: item.name,
    description: item.description,
    width: toNumberOrNull(item.width),
    height: toNumberOrNull(item.height),
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
  const width = Number(merged.width || 0);
  const height = Number(merged.height || 0);
  const pieces = Number(merged.pieces || 1);
  const optionsAmount = Number(merged.options_amount || 0);
  let amountPerPiece = Number(merged.amount_per_piece || 0);

  if (product?.unit === "sqm" && width > 0 && height > 0 && updates.amount_per_piece === undefined) {
    amountPerPiece = (width * height / 10000) * Number(product.price_per_unit || 0);
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
