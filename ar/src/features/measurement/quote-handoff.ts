import type { ModelDefinition } from "./model-catalog";
import type { MeasuredObject } from "./types";
export { formatQuoteDimensions } from "./quote-format";
import { formatQuoteDimensions } from "./quote-format";
import {
  SAVED_AR_QUOTE_KEY,
  type ArQuoteTransferItem,
  type ArQuoteTransferPayload,
  type FlowVersion,
  type SummaryQuoteItem,
  type V2PlacedObject,
} from "./workspace-types";

export function transferItemToSummaryQuoteItem(
  item: ArQuoteTransferItem,
  index: number,
): SummaryQuoteItem {
  return {
    id: -index - 1,
    label: item.label,
    description: item.description,
    dimensionsText: formatQuoteDimensions(item.widthCm, item.heightCm),
    price: item.price ?? null,
  };
}

export function estimateQuotePrice(
  widthCm: number,
  heightCm: number,
  model: ModelDefinition,
) {
  if (model.price == null) return null;

  const unit = model.unit?.toLowerCase() ?? "";
  if (unit.includes("sqm") || unit.includes("sq m")) {
    return Math.round((widthCm / 100) * (heightCm / 100) * model.price);
  }

  return Math.round(model.price);
}

export function formatQuoteCurrency(value: number) {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    maximumFractionDigits: 0,
  }).format(value);
}

export function v2ObjectToQuoteTransferItem(
  object: V2PlacedObject,
  model: ModelDefinition,
): ArQuoteTransferItem | null {
  if (!model.productId) return null;

  return {
    productId: model.productId,
    modelId: model.id,
    label: model.label,
    description: model.description,
    segmentsCm: object.dimensions.segmentsCm,
    widthCm: object.dimensions.segmentsCm[0] ?? 0,
    heightCm: object.dimensions.heightCm,
  };
}

export function objectToQuoteTransferItem(
  object: MeasuredObject,
  model: ModelDefinition,
): ArQuoteTransferItem | null {
  if (!model.productId) return null;

  const widthCm = object.dimensions.segmentsCm.reduce(
    (sum, segment) => sum + segment,
    0,
  );

  return {
    productId: model.productId,
    modelId: model.id,
    label: model.label,
    description: model.description,
    segmentsCm: object.dimensions.segmentsCm,
    widthCm,
    heightCm: object.dimensions.heightCm,
  };
}

export function encodeArQuoteTransfer(payload: ArQuoteTransferPayload) {
  const bytes = new TextEncoder().encode(JSON.stringify(payload));
  let binary = "";

  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });

  return window
    .btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export function readSavedArQuoteItems() {
  try {
    const raw = localStorage.getItem(SAVED_AR_QUOTE_KEY);
    if (!raw) return [];

    const payload = JSON.parse(raw) as Partial<ArQuoteTransferPayload>;
    if (payload.source !== "sog-ar" || !Array.isArray(payload.items)) return [];

    return payload.items.filter(isArQuoteTransferItem);
  } catch {
    return [];
  }
}

function isArQuoteTransferItem(item: unknown): item is ArQuoteTransferItem {
  if (!item || typeof item !== "object") return false;

  const value = item as Record<string, unknown>;
  return (
    typeof value.productId === "number" &&
    typeof value.modelId === "string" &&
    typeof value.label === "string" &&
    typeof value.description === "string" &&
    Array.isArray(value.segmentsCm) &&
    value.segmentsCm.every((segment) => typeof segment === "number") &&
    typeof value.widthCm === "number" &&
    typeof value.heightCm === "number"
  );
}

export function frontendQuoteBaseUrl() {
  const env = (
    import.meta as unknown as { env?: { VITE_FRONTEND_URL?: string } }
  ).env;
  const configured = env?.VITE_FRONTEND_URL?.trim();

  if (configured) return configured.replace(/\/+$/, "");

  const url = new URL(window.location.href);
  if (
    (url.hostname === "localhost" || url.hostname === "127.0.0.1") &&
    url.port === "5173"
  ) {
    url.port = "3000";
    return url.origin;
  }

  return window.location.origin;
}

export function flowVersionFromPath(pathname: string): FlowVersion {
  if (pathname === "/v1" || pathname.endsWith("/v1")) return "v1";
  if (pathname === "/v3" || pathname.endsWith("/v3")) return "v3";
  return "v2";
}

export function flowPath(version: FlowVersion) {
  const prefix = window.location.pathname.startsWith("/ar") ? "/ar" : "";

  return `${prefix}/${version}${window.location.search}${window.location.hash}`;
}

export function captureModeForVersion(version: FlowVersion) {
  if (version === "v1") return "point_measurement";
  if (version === "v3") return "surface_placement";

  return "wall_scan_placement";
}
