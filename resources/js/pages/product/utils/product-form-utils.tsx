import { ALLOWED_TYPES, MAX_FILE_SIZE_MB } from '../types/product-form-types';

// ─── ID Generation ────────────────────────────────────────────────────────────

export const generateId = (): string => {
    if (
        typeof crypto !== 'undefined' &&
        typeof crypto.randomUUID === 'function'
    ) {
        return crypto.randomUUID();
    }
    return Date.now().toString(36) + Math.random().toString(36).slice(2);
};

// ─── File Validation ──────────────────────────────────────────────────────────

export const validateFiles = (
    files: File[],
): { valid: File[]; error?: string } => {
    for (const file of files) {
        if (!ALLOWED_TYPES.includes(file.type))
            return {
                valid: [],
                error: 'Only JPG, PNG, and WEBP images are allowed.',
            };
        if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024)
            return {
                valid: [],
                error: `Each image must be under ${MAX_FILE_SIZE_MB}MB.`,
            };
    }
    return { valid: files };
};

// ─── Variant Form Validation ──────────────────────────────────────────────────

export const validateVariantForm = (
    width: string,
    height: string,
    price: string,
): string => {
    if (!width || !height || !price)
        return 'Width, height, and price are all required.';
    if (isNaN(Number(width)) || isNaN(Number(height)) || isNaN(Number(price)))
        return 'Width, height, and price must be valid numbers.';
    if (Number(width) <= 0 || Number(height) <= 0)
        return 'Width and height must be greater than 0.';
    if (Number(price) < 0) return 'Price must not be negative.';
    return '';
};

// ─── Product Form Validation ──────────────────────────────────────────────────

export interface ProductFormData {
    name: string;
    categories: number[];
    unit: string;
    price_per_unit: string;
}

export interface ProductFormErrors {
    name?: string;
    categories?: string;
    unit?: string;
    price_per_unit?: string;
}

export const validateProductForm = (
    data: ProductFormData,
): ProductFormErrors => {
    const errs: ProductFormErrors = {};
    if (!data.name.trim()) errs.name = 'Product name is required.';
    else if (data.name.length > 255)
        errs.name = 'Name must not exceed 255 characters.';
    if (data.categories.length === 0)
        errs.categories = 'Please select at least one category.';
    if (!data.unit) errs.unit = 'Please select a unit.';
    if (!data.price_per_unit)
        errs.price_per_unit = 'Price per unit is required.';
    else if (
        isNaN(Number(data.price_per_unit)) ||
        Number(data.price_per_unit) < 0
    )
        errs.price_per_unit = 'Price must be a valid positive number.';
    return errs;
};

// ─── Area Calculation ─────────────────────────────────────────────────────────

export const calcArea = (width: string, height: string): string =>
    ((parseFloat(width) * parseFloat(height)) / 10000).toFixed(2);
