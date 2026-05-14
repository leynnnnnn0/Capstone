import type { Product } from "@/features/products/types";
import { productVariants } from "@/features/products/product-utils";
import type { QuoteCartItem, SelectedQuoteOption } from "@/features/quotes/types";
import type { CustomerQuotation } from "@/features/customer/types";

export function customerQuotationToCart(
  quotation: CustomerQuotation | null | undefined,
  products: Product[],
): QuoteCartItem[] {
  if (!quotation) return [];

  return quotation.items.flatMap((item) => {
    if (!item.product_id) return [];

    const product = products.find((candidate) => candidate.id === item.product_id);
    if (!product) return [];

    const variant =
      productVariants(product).find(
        (candidate) =>
          Number(candidate.width) === Number(item.width) &&
          Number(candidate.height) === Number(item.height),
      ) ?? null;

    return [
      {
        id: `quotation-${item.id}`,
        product,
        selected_options: item.options.map<SelectedQuoteOption>((option) => ({
          product_option_group_id: option.product_option_group_id,
          product_option_id: option.product_option_id,
          group_name: option.group_name,
          option_name: option.option_name,
          price_modifier: Number(option.price_modifier),
        })),
        size_mode: variant ? "standard" : "custom",
        variant,
        width: item.width ? String(item.width) : "",
        height: item.height ? String(item.height) : "",
        thickness: item.thickness ? String(item.thickness) : "",
        pieces: item.pieces,
      },
    ];
  });
}
