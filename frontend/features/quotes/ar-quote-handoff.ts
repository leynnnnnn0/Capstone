import type { Product } from "@/features/products/types";
import type { QuoteCartItem } from "@/features/quotes/types";
import { createQuoteId } from "./quote-utils";

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

export function arHandoffToCartItems(
  payload: ArQuoteHandoffPayload,
  products: Product[],
): QuoteCartItem[] {
  return payload.items.flatMap((item) => {
    const product = products.find((candidate) => candidate.id === item.productId);
    if (!product) return [];

    const segments = normalizeSegments(item.segmentsCm, item.widthCm);
    const width = segments.reduce((sum, segment) => sum + segment, 0);
    const height = centimetersToMeters(item.heightCm);

    return [
      {
        id: createQuoteId(),
        product,
        selected_options: [],
        size_mode: "custom",
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

function normalizeSegments(segmentsCm?: number[], widthCm?: number) {
  const segments = (segmentsCm ?? [])
    .map(centimetersToMeters)
    .filter((segment) => segment > 0);

  if (segments.length > 0) return segments;

  const width = centimetersToMeters(widthCm);
  return width > 0 ? [width] : [];
}

function centimetersToMeters(value?: number) {
  if (!Number.isFinite(value)) return 0;
  return roundMeasurement(Number(value) / 100);
}

function roundMeasurement(value: number) {
  return Math.round(value * 1000) / 1000;
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
