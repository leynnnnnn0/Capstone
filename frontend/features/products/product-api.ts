import { api } from "@/lib/api";
import type {
  Category,
  PaginatedResponse,
  Product,
  ProductListFilters,
  UpdateProductPayload,
} from "./types";

type ResourceResponse<T> = { data: T };
type CollectionResponse<T> =
  | T[]
  | PaginatedResponse<T>
  | ResourceResponse<T[]>
  | ResourceResponse<PaginatedResponse<T>>;

/**
 * Convert UI filter state into the query string expected by Laravel.
 */
function searchParams(filters: ProductListFilters) {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value && value !== "all") params.set(key, value);
  });

  return params.toString();
}

/**
 * Fetch product cards for public catalog, admin product list, quote builder, and AR.
 */
export async function fetchProducts(filters: ProductListFilters = {}) {
  const query = searchParams(filters);
  const response = await api<CollectionResponse<Product>>(
    `/api/v1/products${query ? `?${query}` : ""}`,
  );

  return toPaginatedResponse(response);
}

/**
 * Fetch the complete product record used by the public product details page.
 */
export async function fetchProduct(productId: string | number) {
  const response = await api<ResourceResponse<Product>>(`/api/v1/products/${productId}`);
  return unwrapResource(response);
}

/**
 * Fetch categories used by product filters and product forms.
 */
export async function fetchCategories() {
  const response = await api<CollectionResponse<Category>>("/api/v1/categories?per_page=100");
  return unwrapCollection(response);
}

/**
 * Create a product through multipart FormData because products can include files.
 */
export async function createProduct(formData: FormData) {
  const response = await api<ResourceResponse<Product>>("/api/v1/products", {
    method: "POST",
    body: formData,
  });

  return unwrapResource(response);
}

/**
 * Update product data. FormData requests use method spoofing because browsers
 * and Laravel handle multipart PUT less reliably than POST + _method.
 */
export async function updateProduct(productId: number, payload: UpdateProductPayload | FormData) {
  const response = await api<ResourceResponse<Product>>(`/api/v1/products/${productId}`, {
    method: payload instanceof FormData ? "POST" : "PUT",
    body: payload instanceof FormData ? withMethodSpoof(payload, "PUT") : JSON.stringify(payload),
  });

  return unwrapResource(response);
}

/**
 * Delete a product from the catalog.
 */
export async function deleteProduct(productId: number) {
  await api(`/api/v1/products/${productId}`, {
    method: "DELETE",
  });
}

/**
 * Unwrap Laravel resource responses that may be returned as { data }.
 */
function unwrapResource<T>(response: T | ResourceResponse<T>): T {
  if (isDataObject<T>(response)) return response.data;
  return response;
}

/**
 * Normalize all supported collection response shapes into a plain array.
 */
function unwrapCollection<T>(response: CollectionResponse<T>): T[] {
  if (Array.isArray(response)) return response;
  if (isPaginatedResponse(response)) return response.data;
  if (isDataObject<T[]>(response) && Array.isArray(response.data)) return response.data;
  if (isDataObject<PaginatedResponse<T>>(response) && isPaginatedResponse(response.data)) {
    return response.data.data;
  }

  return [];
}

/**
 * Normalize collection responses while preserving pagination metadata when it exists.
 */
function toPaginatedResponse<T>(response: CollectionResponse<T>): PaginatedResponse<T> {
  if (Array.isArray(response)) return { data: response };
  if (isPaginatedResponse(response)) return response;
  if (isDataObject<T[]>(response) && Array.isArray(response.data)) return { data: response.data };
  if (isDataObject<PaginatedResponse<T>>(response) && isPaginatedResponse(response.data)) {
    return response.data;
  }

  return { data: [] };
}

function isDataObject<T>(value: unknown): value is ResourceResponse<T> {
  return Boolean(value && typeof value === "object" && "data" in value);
}

function isPaginatedResponse<T>(value: unknown): value is PaginatedResponse<T> {
  return Boolean(
    value &&
      typeof value === "object" &&
      "data" in value &&
      Array.isArray((value as PaginatedResponse<T>).data),
  );
}

function withMethodSpoof(formData: FormData, method: "PUT" | "PATCH") {
  if (!formData.has("_method")) formData.append("_method", method);
  return formData;
}
