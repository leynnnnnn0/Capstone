"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";

import type { Product } from "@/features/products/types";
import {
  optionGroupOptions,
  productOptionGroups,
  productVariants,
} from "@/features/products/product-utils";
import type { QuoteCartItem } from "@/features/quotes/types";

const STORAGE_KEY = "sog_public_quote_cart";

type PublicQuoteCartContextValue = {
  cart: QuoteCartItem[];
  hydrated: boolean;
  setCart: Dispatch<SetStateAction<QuoteCartItem[]>>;
  removeItem: (id: string) => void;
  clearCart: () => void;
};

const PublicQuoteCartContext = createContext<PublicQuoteCartContextValue | null>(
  null,
);

export function PublicQuoteCartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<QuoteCartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    queueMicrotask(() => {
      setCart(readStoredCart());
      setHydrated(true);
    });
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
    } catch {
      // Browsing can continue when storage is unavailable or full.
    }
  }, [cart, hydrated]);

  const value = useMemo(
    () => ({
      cart,
      hydrated,
      setCart,
      removeItem: (id: string) =>
        setCart((current) => current.filter((item) => item.id !== id)),
      clearCart: () => setCart([]),
    }),
    [cart, hydrated],
  );

  return (
    <PublicQuoteCartContext.Provider value={value}>
      {children}
    </PublicQuoteCartContext.Provider>
  );
}

export function usePublicQuoteCart() {
  const context = useContext(PublicQuoteCartContext);
  if (!context) {
    throw new Error("usePublicQuoteCart must be used within PublicQuoteCartProvider.");
  }

  return context;
}

export function reconcileQuoteCart(
  cart: QuoteCartItem[],
  products: Product[],
) {
  return cart.flatMap((item) => {
    const product = products.find((candidate) => candidate.id === item.product.id);
    if (!product || !product.is_active) return [];

    const variant = item.variant
      ? productVariants(product).find((candidate) => candidate.id === item.variant?.id) ??
        null
      : null;

    const selectedOptions = item.selected_options.flatMap((selected) => {
      const group = productOptionGroups(product).find(
        (candidate) => candidate.id === selected.product_option_group_id,
      );
      const option = group
        ? optionGroupOptions(group).find(
            (candidate) => candidate.id === selected.product_option_id,
          )
        : null;

      if (!group || !option || !option.is_active) return [];

      return [
        {
          product_option_group_id: group.id,
          product_option_id: option.id,
          group_name: group.name,
          option_name: option.name,
          price_modifier: Number(option.price_modifier),
        },
      ];
    });

    return [{ ...item, product, variant, selected_options: selectedOptions }];
  });
}

function readStoredCart() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
    if (!Array.isArray(parsed)) return [];

    return parsed.filter(isStoredQuoteCartItem);
  } catch {
    return [];
  }
}

function isStoredQuoteCartItem(value: unknown): value is QuoteCartItem {
  if (!value || typeof value !== "object") return false;

  const item = value as Partial<QuoteCartItem>;
  return (
    typeof item.id === "string" &&
    Boolean(item.product && typeof item.product.id === "number") &&
    Array.isArray(item.selected_options) &&
    (item.size_mode === "standard" || item.size_mode === "custom") &&
    typeof item.width === "string" &&
    typeof item.height === "string" &&
    typeof item.thickness === "string" &&
    typeof item.pieces === "number" &&
    item.pieces > 0
  );
}
