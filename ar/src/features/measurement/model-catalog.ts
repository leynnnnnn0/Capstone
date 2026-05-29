import type { ObjectType } from "./types";

export type ModelCategoryId = string;

export interface ModelCategory {
  id: ModelCategoryId;
  label: string;
  description: string;
}

export interface ModelVariantDefinition {
  id: string;
  label: string;
  widthCm?: number | null;
  heightCm?: number | null;
  price?: number | null;
  thumbnail?: string | null;
}

export interface ModelDefinition {
  id: string;
  category: ModelCategoryId;
  type: ObjectType;
  label: string;
  description: string;
  file: string;
  thumbnail?: string | null;
  images?: string[];
  variants?: ModelVariantDefinition[];
  defaultWidthCm?: number | null;
  defaultHeightCm?: number | null;
  price?: number | null;
  unit?: string | null;
  productId?: number;
  source?: "api" | "fallback";
}

interface ProductCategoryPayload {
  id?: number;
  name?: string;
}

interface ProductImagePayload {
  image_url?: string | null;
}

interface Product3DModelPayload {
  id?: number;
  file_url?: string | null;
  original_name?: string | null;
}

interface ProductVariantPayload {
  id?: number;
  name?: string | null;
  width?: number | string | null;
  height?: number | string | null;
  price?: number | string | null;
  images?: ProductImagePayload[];
}

interface ProductPayload {
  id: number;
  name?: string | null;
  description?: string | null;
  unit?: string | null;
  price_per_unit?: number | string | null;
  is_active?: boolean;
  cover_image?: string | null;
  categories?: ProductCategoryPayload[];
  images?: ProductImagePayload[];
  variants?: ProductVariantPayload[];
  model_3d?: Product3DModelPayload | null;
}

export const MODEL_CATEGORIES: ModelCategory[] = [
  {
    id: "all",
    label: "All",
    description: "Every AR-ready product",
  },
  {
    id: "doors",
    label: "Doors",
    description: "Sliding and swing door layouts",
  },
  {
    id: "windows",
    label: "Windows",
    description: "Window panels and glass openings",
  },
  {
    id: "cabinets",
    label: "Cabinets",
    description: "Straight and L-shaped cabinet work",
  },
];

export const MODEL_CATALOG: ModelDefinition[] = [
  {
    id: "fallback-door-1",
    category: "doors",
    type: "door",
    label: "Door 1",
    description: "Local fallback model",
    file: "/models/door1.glb",
    source: "fallback",
  },
  {
    id: "fallback-window-1",
    category: "windows",
    type: "window",
    label: "Window",
    description: "Local fallback model",
    file: "/models/window.glb",
    thumbnail: "/models/window.jpg",
    source: "fallback",
  },
  {
    id: "fallback-cabinet-l",
    category: "cabinets",
    type: "cabinet",
    label: "Cabinet L",
    description: "Local fallback model",
    file: "/models/cabinet_l.glb",
    source: "fallback",
  },
];

export const DEFAULT_MODEL = MODEL_CATALOG[0];

export interface ProductModelCatalogResult {
  categories: ModelCategory[];
  models: ModelDefinition[];
}

export function getModelById(models: ModelDefinition[], id: string) {
  return models.find((model) => model.id === id) ?? models[0] ?? DEFAULT_MODEL;
}

export async function fetchProductModelCatalog(): Promise<ProductModelCatalogResult> {
  const apiBase = getApiBaseUrl();
  const response = await fetch(`${apiBase}/api/v1/products?per_page=100`, {
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Unable to load AR products (${response.status}).`);
  }

  const payload = await response.json();
  const products = normalizeProductResponse(payload);
  const models = products
    .filter((product) => product.is_active !== false)
    .map((product) => productToModel(product, apiBase))
    .filter((model): model is ModelDefinition => Boolean(model));

  return {
    categories: buildCategories(models),
    models,
  };
}

function getApiBaseUrl() {
  const env = (import.meta as unknown as { env?: { VITE_API_URL?: string } }).env;
  const configured = env?.VITE_API_URL;
  const fallback =
    window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
      ? "http://localhost:8000"
      : window.location.origin;

  return (configured?.trim() || fallback)
    .replace(/\/+$/, "")
    .replace(/\/api\/v1$/, "")
    .replace(/\/api$/, "");
}

function normalizeProductResponse(payload: unknown): ProductPayload[] {
  if (Array.isArray(payload)) return payload as ProductPayload[];

  if (isRecord(payload) && Array.isArray(payload.data)) {
    return payload.data as ProductPayload[];
  }

  if (
    isRecord(payload) &&
    isRecord(payload.data) &&
    Array.isArray(payload.data.data)
  ) {
    return payload.data.data as ProductPayload[];
  }

  return [];
}

function productToModel(
  product: ProductPayload,
  apiBase: string,
): ModelDefinition | null {
  const fileUrl = product.model_3d?.file_url;

  if (!fileUrl) {
    return null;
  }

  const categoryName = firstCategoryName(product) ?? inferCategoryLabel(product);
  const type = inferObjectType(product, categoryName);
  const category = categoryIdFor(type, categoryName);
  const productName = cleanText(product.name) || `Product ${product.id}`;
  const description = cleanText(product.description) || "AR-ready 3D product model.";
  const images = productImageUrls(product, apiBase);

  return {
    id: `product-${product.id}`,
    category,
    type,
    label: productName,
    description,
    file: normalizeCatalogAssetUrl(fileUrl, apiBase),
    thumbnail: images[0] ?? null,
    images,
    variants: productVariants(product, apiBase),
    price: product.price_per_unit == null ? null : Number(product.price_per_unit),
    unit: product.unit ?? null,
    productId: product.id,
    source: "api",
  };
}

function buildCategories(models: ModelDefinition[]): ModelCategory[] {
  const categories = new Map<ModelCategoryId, ModelCategory>();

  categories.set("all", MODEL_CATEGORIES[0]);

  for (const model of models) {
    if (categories.has(model.category)) continue;

    const fallbackLabel = categoryLabelFor(model.type);
    categories.set(model.category, {
      id: model.category,
      label: fallbackLabel,
      description: `${fallbackLabel} with uploaded 3D models`,
    });
  }

  for (const category of MODEL_CATEGORIES.slice(1)) {
    if (models.some((model) => model.category === category.id)) {
      categories.set(category.id, category);
    }
  }

  return [...categories.values()];
}

function productImageUrls(product: ProductPayload, apiBase: string) {
  const urls = [
    product.cover_image,
    ...(product.images?.map((image) => image.image_url) ?? []),
  ].filter((url): url is string => Boolean(cleanText(url)));

  return [...new Set(urls.map((url) => normalizeCatalogAssetUrl(url, apiBase)))];
}

function productVariants(product: ProductPayload, apiBase: string) {
  return (product.variants ?? []).map((variant, index) => {
    const widthCm = Number(variant.width);
    const heightCm = Number(variant.height);
    const price = Number(variant.price);
    const thumbnail = variant.images?.[0]?.image_url;

    return {
      id: `variant-${product.id}-${variant.id ?? index}`,
      label: cleanText(variant.name) || variantSizeLabel(widthCm, heightCm) || `Variant ${index + 1}`,
      widthCm: Number.isFinite(widthCm) ? widthCm : null,
      heightCm: Number.isFinite(heightCm) ? heightCm : null,
      price: Number.isFinite(price) ? price : null,
      thumbnail: thumbnail ? normalizeCatalogAssetUrl(thumbnail, apiBase) : null,
    };
  });
}

function variantSizeLabel(widthCm: number, heightCm: number) {
  if (!Number.isFinite(widthCm) || !Number.isFinite(heightCm)) return "";

  return `${widthCm} x ${heightCm} cm`;
}

export function normalizeCatalogAssetUrl(url: string, apiBase = getApiBaseUrl()) {
  const parsed = new URL(url, apiBase);
  const api = new URL(apiBase);

  if (
    !isLocalHost(api.hostname) &&
    (isLocalHost(parsed.hostname) || parsed.port === "8000")
  ) {
    parsed.protocol = api.protocol;
    parsed.host = api.host;
  }

  return parsed.href;
}

function firstCategoryName(product: ProductPayload) {
  return product.categories?.map((category) => cleanText(category.name)).find(Boolean);
}

function inferCategoryLabel(product: ProductPayload) {
  const haystack = `${product.name ?? ""} ${product.description ?? ""}`.toLowerCase();

  if (haystack.includes("door")) return "Doors";
  if (haystack.includes("window")) return "Windows";
  if (haystack.includes("cabinet")) return "Cabinets";
  if (haystack.includes("shower")) return "Shower Enclosures";

  return "Other";
}

function inferObjectType(
  product: ProductPayload,
  categoryName: string,
): ObjectType {
  const haystack = `${categoryName} ${product.name ?? ""} ${product.description ?? ""}`.toLowerCase();

  if (haystack.includes("shower")) return "shower";
  if (haystack.includes("cabinet")) return "cabinet";
  if (haystack.includes("window")) return "window";
  if (haystack.includes("door")) return "door";

  return "other";
}

function categoryIdFor(type: ObjectType, categoryName: string) {
  if (type === "door") return "doors";
  if (type === "window") return "windows";
  if (type === "cabinet") return "cabinets";
  if (type === "shower") return "showers";

  return slugify(categoryName) || "other";
}

function categoryLabelFor(type: ObjectType) {
  if (type === "door") return "Doors";
  if (type === "window") return "Windows";
  if (type === "cabinet") return "Cabinets";
  if (type === "shower") return "Shower Enclosures";

  return "Other";
}

function cleanText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function isRecord(value: unknown): value is Record<string, any> {
  return Boolean(value) && typeof value === "object";
}

function isLocalHost(hostname: string) {
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
}
