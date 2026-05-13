// ─── Domain Types ─────────────────────────────────────────────────────────────

export interface ProductOption {
    id: number;
    name: string;
    price_modifier: number | string;
    is_active: boolean;
}

export interface ProductOptionGroup {
    id: number;
    name: string;
    is_required: boolean;
    product_options: ProductOption[];
}

export interface ProductVariant {
    id: number;
    width: number;
    height: number;
    price: number;
}

export interface Product {
    id: number;
    name: string;
    unit: string;
    price_per_unit: number;
    product_variants: ProductVariant[];
    product_option_groups: ProductOptionGroup[];
}

export interface SelectedOption {
    product_option_group_id: number;
    product_option_id: number;
    group_name: string;
    option_name: string;
    price_modifier: number;
}

export interface LineItem {
    _id: string;
    /** When editing an existing item we keep its server id so we can PATCH it */
    server_id?: number;
    product_id: string;
    name: string;
    description: string;
    width: string;
    height: string;
    thickness: string;
    pieces: string;
    amount_per_piece: string;
    options_amount: string;
    total_amount: string;
    notes: string;
    selected_options: SelectedOption[];
}

export interface ExistingQuotationItem {
    id: number;
    name: string;
    description: string | null;
    width: number | null;
    height: number | null;
    thickness: number | null;
    pieces: number;
    amount_per_piece: number | string;
    options_amount: number | string;
    total_amount: number | string;
    notes: string | null;
    product_id: number;
    quotation_item_options: {
        id: number;
        group_name: string;
        option_name: string;
        price_modifier: number | string;
        product_option_group_id: number;
        product_option_id: number;
    }[];
}

export interface ExistingQuotation {
    id: number;
    notes: string | null;
    quotation_items: ExistingQuotationItem[];
}

export interface QuotationFormProps {
    appointmentId: number;
    products: Product[];
    existingQuotation?: ExistingQuotation | null;
}
