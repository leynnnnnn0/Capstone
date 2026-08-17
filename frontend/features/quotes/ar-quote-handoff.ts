import type { Product } from "@/features/products/types";
import type { QuoteCartItem } from "@/features/quotes/types";
import { createQuoteId } from "./quote-utils";

export const AR_QUOTE_STORAGE_KEY = "sog-ar-saved-quote";

export type ArQuoteHandoffItem = {
  productId: number;
  modelId?: string;
  label?: string;
  description?: string;
  segmentsCm?: number[];
  widthCm?: number;
  heightCm?: number;
};

export type ArQuoteHandoffPayload = {
  source: "sog-ar";
  version: 1;
  createdAt?: string;
  items: ArQuoteHandoffItem[];
};

/**
 * Decode and validate the compact AR handoff payload from the URL.
 *
 * AR runs as a separate app, so it sends measurements to the Next.js quote page
 * as base64url JSON in the ar_items query parameter.
 */
export function parseArQuoteHandoff(value: string | null): ArQuoteHandoffPayload | null {
  if (!value) return null;

  try {
    const decoded = decodeBase64Url(value);
    const parsed = JSON.parse(decoded) as Partial<ArQuoteHandoffPayload>;

    if (parsed.source !== "sog-ar" || !Array.isArray(parsed.items)) {
      return null;
    }

    return {
      source: "sog-ar",
      version: 1,
      createdAt: typeof parsed.createdAt === "string" ? parsed.createdAt : undefined,
      items: parsed.items
        .map(normalizeHandoffItem)
        .filter((item): item is ArQuoteHandoffItem => Boolean(item)),
    };
  } catch {
    return null;
  }
}

/**
 * Convert AR measurements into quote cart items.
 *
 * The AR payload stores product IDs and dimensions. This function joins those
 * measurements with the freshly fetched product records so quote checkout uses
 * normal product data and the standard pricing pipeline.
 */
export function arHandoffToCartItems(
  payload: ArQuoteHandoffPayload,
  products: Product[],
): QuoteCartItem[] {
  return payload.items.flatMap((item) => {
    const product = products.find((candidate) => candidate.id === item.productId);
    if (!product) return [];

    const segments = normalizeSegmentsCm(item.segmentsCm, item.widthCm);
    const width = segments.reduce((sum, segment) => sum + segment, 0);
    const height = roundMeasurement(item.heightCm ?? 0);

    return [
      {
        id: createQuoteId(),
        product,
        selected_options: [],
        size_mode: "custom",
        dimension_unit: "cm",
        variant: null,
        width: formatMeasurement(width),
        height: formatMeasurement(height),
        thickness: "",
        pieces: 1,
        source: "ar",
        measurement_segments: segments,
        measurement_height: height,
      },
    ];
  });
}

/**
 * Accept only the handoff fields the quote builder knows how to use.
 */
function normalizeHandoffItem(item: unknown): ArQuoteHandoffItem | null {
  if (!item || typeof item !== "object") return null;

  const value = item as Record<string, unknown>;
  const productId = Number(value.productId);
  if (!Number.isFinite(productId) || productId <= 0) return null;

  return {
    productId,
    modelId: stringValue(value.modelId),
    label: stringValue(value.label),
    description: stringValue(value.description),
    segmentsCm: numberArray(value.segmentsCm),
    widthCm: numberValue(value.widthCm),
    heightCm: numberValue(value.heightCm),
  };
}

/**
 * Prefer explicit AR segment lengths, but fall back to a single width when older
 * AR payloads do not include the full segment array.
 */
function normalizeSegmentsCm(segmentsCm?: number[], widthCm?: number) {
  const segments = (segmentsCm ?? [])
    .map(roundMeasurement)
    .filter((segment) => segment > 0);

  if (segments.length > 0) return segments;

  const width = roundMeasurement(widthCm ?? 0);
  return width > 0 ? [width] : [];
}

function roundMeasurement(value: number) {
  return Math.round(value * 1000) / 1000;
}

export function removeSavedArQuoteItem(item: QuoteCartItem) {
  if (item.source !== "ar") return;

  try {
    const raw = localStorage.getItem(AR_QUOTE_STORAGE_KEY);
    if (!raw) return;

    const payload = JSON.parse(raw) as Partial<ArQuoteHandoffPayload>;
    if (payload.source !== "sog-ar" || !Array.isArray(payload.items)) return;

    const index = payload.items.findIndex((savedItem) =>
      savedItemMatchesCartItem(savedItem, item),
    );
    if (index < 0) return;

    const items = payload.items.filter((_, itemIndex) => itemIndex !== index);
    if (items.length === 0) {
      localStorage.removeItem(AR_QUOTE_STORAGE_KEY);
      return;
    }

    localStorage.setItem(
      AR_QUOTE_STORAGE_KEY,
      JSON.stringify({ ...payload, items }),
    );
  } catch {
    // The quote cart remains usable when browser storage is unavailable.
  }
}

export function clearSavedArQuote() {
  try {
    localStorage.removeItem(AR_QUOTE_STORAGE_KEY);
  } catch {
    // The in-memory quote can still be cleared.
  }
}

function savedItemMatchesCartItem(
  savedItem: ArQuoteHandoffItem,
  cartItem: QuoteCartItem,
) {
  if (savedItem.productId !== cartItem.product.id) return false;

  const savedSegments = normalizeSegmentsCm(
    savedItem.segmentsCm,
    savedItem.widthCm,
  );
  const cartSegments = (cartItem.measurement_segments?.length
    ? cartItem.measurement_segments
    : [Number(cartItem.width)]
  )
    .map((segment) =>
      cartItem.dimension_unit === "cm" ? segment : segment * 100,
    )
    .filter((segment) => Number.isFinite(segment) && segment > 0);
  const cartHeight =
    Number(cartItem.height || cartItem.measurement_height || 0) *
    (cartItem.dimension_unit === "cm" ? 1 : 100);

  return (
    measurementsMatch(savedSegments, cartSegments) &&
    Math.abs((savedItem.heightCm ?? 0) - cartHeight) < 0.11
  );
}

function measurementsMatch(left: number[], right: number[]) {
  return (
    left.length === right.length &&
    left.every((value, index) => Math.abs(value - right[index]) < 0.11)
  );
}

function formatMeasurement(value: number) {
  return value > 0 ? String(roundMeasurement(value)) : "";
}

function stringValue(value: unknown) {
  return typeof value === "string" ? value : undefined;
}

function numberValue(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function numberArray(value: unknown) {
  if (!Array.isArray(value)) return undefined;
  return value.map(numberValue).filter((item): item is number => item !== undefined);
}

function decodeBase64Url(value: string) {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
  const binary = window.atob(padded);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}
