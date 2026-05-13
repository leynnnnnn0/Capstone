// ─── Constants ────────────────────────────────────────────────────────────────
export const MAX_PRODUCT_IMAGES = 10;
export const MAX_VARIANT_IMAGES = 5;
export const MAX_FILE_SIZE_MB = 5;
export const ALLOWED_TYPES = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
];

export const UNITS = [
    { value: 'sqft', label: 'Square Foot (sq ft)' },
    { value: 'meter', label: 'Linear Meter (meter)' },
    { value: 'piece', label: 'Piece (pc)' },
    { value: 'set', label: 'Set' },
] as const;

// ─── Shared Types ─────────────────────────────────────────────────────────────

export interface CategoryOption {
    id: number;
    name: string;
}

/** An image already persisted on the server. */
export interface ExistingImage {
    id: number;
    url: string;
    image_path: string;
}

/** A locally-selected file not yet uploaded. */
export interface NewImageFile {
    id: string;
    file: File;
    preview: string;
}

/** Client-side field error map (shared across Create & Edit). */
export interface ClientErrors {
    name?: string;
    categories?: string;
    unit?: string;
    price_per_unit?: string;
    images?: string;
}

// ─── Create-specific types ────────────────────────────────────────────────────

export interface ImageFile {
    id: string;
    file: File;
    preview: string;
}

export interface Variant {
    id: string;
    width: string;
    height: string;
    price: string;
    images: ImageFile[];
}

// ─── Edit-specific types ──────────────────────────────────────────────────────

export interface ExistingVariant {
    id: number;
    width: string;
    height: string;
    price: string;
    is_active: boolean;
    existingImages: ExistingImage[];
    newImages: NewImageFile[];
    deletedImageIds: number[];
}

export interface NewVariant {
    id: string;
    width: string;
    height: string;
    price: string;
    newImages: NewImageFile[];
}

export interface VariantFormState {
    width: string;
    height: string;
    price: string;
}
