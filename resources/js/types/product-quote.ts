// ─── Backend-shaped types (matches Laravel API output) ───────────────────────

export interface ProductImage {
    id: number;
    image_path: string;
    url: string; // Storage::url() appended by controller
}

export interface ProductOption {
    id: number;
    name: string;
    price_modifier: number;
    is_active: boolean;
}

export interface ProductOptionGroup {
    id: number;
    name: string;
    is_required: boolean;
    product_options: ProductOption[];
}

export interface ProductVariantImage {
    id: number;
    image_path: string;
    url: string;
}

export interface ProductVariant {
    id: number;
    width: number;
    height: number;
    price: number;
    product_variant_images: ProductVariantImage[];
}

export interface Product {
    id: number;
    name: string;
    description: string;
    unit: 'sqm' | 'meter' | 'piece' | 'set';
    price_per_unit: number;
    product_images: ProductImage[];
    product_variants: ProductVariant[];
    product_option_groups: ProductOptionGroup[];
}

// ─── Cart / UI-only types ────────────────────────────────────────────────────

export type SizeMode = 'standard' | 'custom';

export interface SelectedOption {
    product_option_group_id: number;
    product_option_id: number;
    group_name: string;
    option_name: string;
    price_modifier: number;
}

export interface CartItem {
    _id: number; // local-only UI key
    product: Product;
    selected_options: SelectedOption[]; // flat list for submission
    size_mode: SizeMode;
    variant: ProductVariant | null; // null when custom
    width: string;
    height: string;
    thickness: string;
    pieces: number;
}

// ─── Form submission payload (mirrors QuotationController validation) ────────

export interface QuoteItemPayload {
    product_id: number;
    name: string;
    description: string;
    width: number | null;
    height: number | null;
    thickness: number | null;
    pieces: number;
    amount_per_piece: number;
    options_amount: number;
    total_amount: number;
    notes: string;
    selected_options: SelectedOption[];
}

export interface QuoteFormPayload {
    first_name: string;
    last_name: string;
    phone_number: string;
    email: string;
    address: string;
    address_pinned: string;
    address_lat: string;
    address_lng: string;
    preferred_date: string;
    preferred_time: string;
    additional_notes: string;
    consent: boolean;
    items: QuoteItemPayload[];
}

// ─── Page props (from Inertia) ────────────────────────────────────────────────

export interface GetQuotePageProps {
    products: Product[];
    preSelectedProduct: number | null;
    preSelectedProductVariant: number | null;
}
