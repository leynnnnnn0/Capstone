export type Category = {
  id: number;
  name: string;
  remarks?: string | null;
};

export type ProductImage = {
  id: number;
  image_url?: string;
  url?: string;
};

export type ResourceCollection<T> = T[] | { data: T[] };

export type ProductOption = {
  id: number;
  name: string;
  price_modifier: number | string;
  sort_order: number;
  is_active: boolean;
};

export type ProductOptionGroup = {
  id: number;
  name: string;
  is_required: boolean;
  sort_order: number;
  options?: ProductOption[];
  product_options?: ProductOption[];
};

export type ProductVariant = {
  id: number;
  width: number | string;
  height: number | string;
  price: number | string;
  is_active: boolean;
  images?: ProductImage[];
  product_variant_images?: ProductImage[];
};

export type Product = {
  id: number;
  name: string;
  description: string;
  unit: ProductUnit;
  price_per_unit: number | string;
  is_active: boolean;
  cover_image?: string | null;
  categories?: ResourceCollection<Category>;
  images?: ResourceCollection<ProductImage>;
  product_images?: ResourceCollection<ProductImage>;
  variants?: ResourceCollection<ProductVariant>;
  product_variants?: ResourceCollection<ProductVariant>;
  option_groups?: ResourceCollection<ProductOptionGroup>;
  product_option_groups?: ResourceCollection<ProductOptionGroup>;
};

export type ProductUnit = "sqm" | "meter" | "piece" | "set";

export type PaginatedResponse<T> = {
  data: T[];
  meta?: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
  };
  links?: Record<string, string | null>;
};

export type ProductListFilters = {
  search?: string;
  is_active?: string;
  category_id?: string;
  per_page?: string;
};

export type NewImageFile = {
  id: string;
  file: File;
  preview: string;
};

export type ProductVariantDraft = {
  id: string;
  width: string;
  height: string;
  price: string;
  images: NewImageFile[];
  existing_images?: ProductImage[];
  deleted_image_ids?: number[];
};

export type ProductOptionDraft = {
  id: string;
  name: string;
  price_modifier: string;
  sort_order: number;
  is_active: boolean;
};

export type ProductOptionGroupDraft = {
  id: string;
  name: string;
  is_required: boolean;
  sort_order: number;
  options: ProductOptionDraft[];
};

export type ProductFormState = {
  name: string;
  description: string;
  category_ids: number[];
  unit: ProductUnit | "";
  price_per_unit: string;
  is_active: boolean;
  images: NewImageFile[];
  deleted_image_ids: number[];
  variants: ProductVariantDraft[];
  option_groups: ProductOptionGroupDraft[];
};

export type ProductFormErrors = Partial<
  Record<
    | keyof ProductFormState
    | "form"
    | `variants.${number}.${string}`
    | `option_groups.${number}.${string}`,
    string
  >
>;

export type UpdateProductPayload = Pick<
  ProductFormState,
  "name" | "description" | "category_ids" | "unit" | "price_per_unit" | "is_active"
>;
