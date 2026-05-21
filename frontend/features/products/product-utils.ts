import type {
  Product,
  Product3DModel,
  ProductFormState,
  ProductImage,
  ProductOptionGroup,
  ResourceCollection,
  UpdateProductPayload,
  ProductUnit,
  ProductVariant,
} from "./types";

export const PRODUCT_UNITS: Array<{ label: string; value: ProductUnit }> = [
  { value: "sqm", label: "Square Meter (sqm)" },
  { value: "meter", label: "Linear Meter" },
  { value: "piece", label: "Piece" },
  { value: "set", label: "Set" },
];

export const MAX_PRODUCT_IMAGES = 10;
export const MAX_VARIANT_IMAGES = 5;
export const MAX_FILE_SIZE_MB = 5;
export const MAX_3D_MODEL_SIZE_MB = 50;
export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
];
export const ALLOWED_3D_MODEL_EXTENSIONS = [".glb", ".gltf"];

export function generateId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`;
}

export function createInitialProductForm(): ProductFormState {
  return {
    name: "",
    description: "",
    category_ids: [],
    unit: "",
    price_per_unit: "",
    is_active: true,
    images: [],
    deleted_image_ids: [],
    model_3d: null,
    existing_3d_model: null,
    delete_3d_model: false,
    variants: [],
    option_groups: [],
  };
}

export function createProductEditForm(product: Product): ProductFormState {
  return {
    name: product.name,
    description: product.description ?? "",
    category_ids: productCategories(product).map((category) => category.id),
    unit: product.unit,
    price_per_unit: String(product.price_per_unit ?? ""),
    is_active: product.is_active,
    images: [],
    deleted_image_ids: [],
    model_3d: null,
    existing_3d_model: product3DModel(product),
    delete_3d_model: false,
    variants: productVariants(product).map((variant) => ({
      id: String(variant.id),
      width: String(variant.width ?? ""),
      height: String(variant.height ?? ""),
      price: String(variant.price ?? ""),
      images: [],
      existing_images: variantImages(variant),
      deleted_image_ids: [],
    })),
    option_groups: productOptionGroups(product).map((group, groupIndex) => ({
      id: String(group.id),
      name: group.name,
      is_required: group.is_required,
      sort_order: group.sort_order ?? groupIndex,
      options: optionGroupOptions(group).map((option, optionIndex) => ({
        id: String(option.id),
        name: option.name,
        price_modifier: String(option.price_modifier ?? "0"),
        sort_order: option.sort_order ?? optionIndex,
        is_active: option.is_active,
      })),
    })),
  };
}

export function validate3DModelFile(file: File | null) {
  if (!file) return { valid: true };

  const extension = `.${file.name.split(".").pop()?.toLowerCase() ?? ""}`;
  if (!ALLOWED_3D_MODEL_EXTENSIONS.includes(extension)) {
    return { valid: false, error: "Only GLB and GLTF 3D model files are allowed." };
  }

  if (file.size > MAX_3D_MODEL_SIZE_MB * 1024 * 1024) {
    return { valid: false, error: `The 3D model must be under ${MAX_3D_MODEL_SIZE_MB}MB.` };
  }

  return { valid: true };
}

export function validateImageFiles(files: File[]) {
  for (const file of files) {
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      return { valid: [] as File[], error: "Only JPG, PNG, and WEBP images are allowed." };
    }

    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      return { valid: [] as File[], error: `Each image must be under ${MAX_FILE_SIZE_MB}MB.` };
    }
  }

  return { valid: files };
}

export function createImageDrafts(files: File[]) {
  return files.map((file) => ({
    id: generateId(),
    file,
    preview: URL.createObjectURL(file),
  }));
}

export function formatCurrency(value: number | string) {
  const amount = Number(value || 0);
  return `PHP ${amount.toLocaleString("en-PH", {
    maximumFractionDigits: 2,
  })}`;
}

export function calcArea(width: number | string, height: number | string) {
  return ((Number(width) * Number(height)) / 10000).toFixed(2);
}

function unwrapCollection<T>(value?: ResourceCollection<T>): T[] {
  if (!value) return [];
  return Array.isArray(value) ? value : value.data;
}

export function productCategories(product: Product) {
  return unwrapCollection(product.categories);
}

export function productImages(product: Product): ProductImage[] {
  return unwrapCollection(product.images ?? product.product_images);
}

export function product3DModel(product: Product): Product3DModel | null {
  return product.model_3d ?? product.product_3d_model ?? null;
}

export function productVariants(product: Product): ProductVariant[] {
  return unwrapCollection(product.variants ?? product.product_variants);
}

export function variantImages(variant: ProductVariant): ProductImage[] {
  return unwrapCollection(variant.images ?? variant.product_variant_images);
}

export function productOptionGroups(product: Product): ProductOptionGroup[] {
  return unwrapCollection(product.option_groups ?? product.product_option_groups);
}

export function imageUrl(image?: ProductImage | null) {
  return normalizeAssetUrl(image?.image_url ?? image?.url ?? "");
}

export function productCover(product: Product) {
  return normalizeAssetUrl(product.cover_image ?? imageUrl(productImages(product)[0]));
}

export function model3DUrl(model?: Product3DModel | null) {
  return normalizeAssetUrl(model?.file_url ?? "");
}

export function formatFileSize(bytes?: number | null) {
  if (!bytes) return "";

  if (bytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  }

  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function optionGroupOptions(group: ProductOptionGroup) {
  return group.options ?? group.product_options ?? [];
}

export function normalizeAssetUrl(url?: string | null) {
  if (!url) return "";

  const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

  if (url.startsWith("/storage/")) {
    return `${apiBase.replace(/\/$/, "")}${url}`;
  }

  try {
    const parsed = new URL(url);
    const api = new URL(apiBase);
    const localHostWithoutPort =
      (parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1") &&
      !parsed.port &&
      Boolean(api.port);

    if (localHostWithoutPort) {
      parsed.protocol = api.protocol;
      parsed.host = api.host;
      return parsed.toString();
    }
  } catch {
    return url;
  }

  return url;
}

export function toUpdateProductPayload(data: ProductFormState): UpdateProductPayload {
  return {
    name: data.name,
    description: data.description,
    category_ids: data.category_ids,
    unit: data.unit,
    price_per_unit: data.price_per_unit,
    is_active: data.is_active,
  };
}

export function appendProductFormData(data: ProductFormState) {
  const formData = new FormData();

  formData.append("name", data.name);
  formData.append("description", data.description);
  formData.append("unit", data.unit);
  formData.append("price_per_unit", data.price_per_unit);
  formData.append("is_active", data.is_active ? "1" : "0");

  data.category_ids.forEach((categoryId) => {
    formData.append("category_ids[]", String(categoryId));
  });

  data.images.forEach((image) => {
    formData.append("images[]", image.file);
  });

  data.deleted_image_ids.forEach((imageId) => {
    formData.append("deleted_image_ids[]", String(imageId));
  });

  if (data.model_3d) {
    formData.append("model_3d", data.model_3d);
  }

  if (data.delete_3d_model) {
    formData.append("delete_3d_model", "1");
  }

  data.variants.forEach((variant, variantIndex) => {
    appendExistingId(formData, `variants[${variantIndex}][id]`, variant.id);
    formData.append(`variants[${variantIndex}][width]`, variant.width);
    formData.append(`variants[${variantIndex}][height]`, variant.height);
    formData.append(`variants[${variantIndex}][price]`, variant.price);
    formData.append(`variants[${variantIndex}][is_active]`, "1");
    variant.images.forEach((image) => {
      formData.append(`variants[${variantIndex}][images][]`, image.file);
    });
    variant.deleted_image_ids?.forEach((imageId) => {
      formData.append(
        `variants[${variantIndex}][deleted_image_ids][]`,
        String(imageId),
      );
    });
  });

  data.option_groups.forEach((group, groupIndex) => {
    appendExistingId(formData, `option_groups[${groupIndex}][id]`, group.id);
    formData.append(`option_groups[${groupIndex}][name]`, group.name);
    formData.append(
      `option_groups[${groupIndex}][is_required]`,
      group.is_required ? "1" : "0",
    );
    formData.append(`option_groups[${groupIndex}][sort_order]`, String(groupIndex));

    group.options.forEach((option, optionIndex) => {
      appendExistingId(
        formData,
        `option_groups[${groupIndex}][options][${optionIndex}][id]`,
        option.id,
      );
      formData.append(
        `option_groups[${groupIndex}][options][${optionIndex}][name]`,
        option.name,
      );
      formData.append(
        `option_groups[${groupIndex}][options][${optionIndex}][price_modifier]`,
        option.price_modifier || "0",
      );
      formData.append(
        `option_groups[${groupIndex}][options][${optionIndex}][sort_order]`,
        String(optionIndex),
      );
      formData.append(
        `option_groups[${groupIndex}][options][${optionIndex}][is_active]`,
        option.is_active ? "1" : "0",
      );
    });
  });

  return formData;
}

function appendExistingId(formData: FormData, key: string, id: string) {
  if (/^\d+$/.test(id)) formData.append(key, id);
}
