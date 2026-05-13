import type { ExistingQuotationItem, LineItem } from '../types';

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

// ─── Formatting ───────────────────────────────────────────────────────────────

export const fmt = (n: number | string) =>
    parseFloat(String(n) || '0').toLocaleString('en-PH', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });

// ─── Factories ────────────────────────────────────────────────────────────────

export const makeBlankItem = (): LineItem => ({
    _id: generateId(),
    product_id: '',
    name: '',
    description: '',
    width: '',
    height: '',
    thickness: '',
    pieces: '1',
    amount_per_piece: '',
    options_amount: '0',
    total_amount: '0',
    notes: '',
    selected_options: [],
});

/** Map a saved quotation item back into the editable LineItem shape */
export const fromExistingItem = (item: ExistingQuotationItem): LineItem => ({
    _id: generateId(),
    server_id: item.id,
    product_id: String(item.product_id),
    name: item.name,
    description: item.description ?? '',
    width: item.width != null ? String(item.width) : '',
    height: item.height != null ? String(item.height) : '',
    thickness: item.thickness != null ? String(item.thickness) : '',
    pieces: String(item.pieces),
    amount_per_piece: String(item.amount_per_piece),
    options_amount: String(item.options_amount),
    total_amount: String(item.total_amount),
    notes: item.notes ?? '',
    selected_options: item.quotation_item_options.map((o) => ({
        product_option_group_id: o.product_option_group_id,
        product_option_id: o.product_option_id,
        group_name: o.group_name,
        option_name: o.option_name,
        price_modifier: Number(o.price_modifier),
    })),
});

// ─── Validation Helpers ───────────────────────────────────────────────────────

/** Returns true if the string contains at least one alphabetic character */
export const containsLetter = (value: string): boolean =>
    /[a-zA-Z]/.test(value);

// ─── Validation ───────────────────────────────────────────────────────────────

export const validateItems = (items: LineItem[]): Record<string, string> => {
    const errs: Record<string, string> = {};

    if (items.length === 0) {
        errs['items'] = 'At least one item is required.';
    }

    items.forEach((item, i) => {
        if (!item.product_id) {
            errs[`items.${i}.product_id`] = 'Product is required.';
        }

        if (!item.name.trim()) {
            errs[`items.${i}.name`] = 'Item name is required.';
        } else if (!containsLetter(item.name)) {
            errs[`items.${i}.name`] =
                'Item name must contain at least one letter.';
        }

        if (!item.pieces || parseInt(item.pieces) < 1) {
            errs[`items.${i}.pieces`] = 'At least 1 piece required.';
        }

        // String fields that must contain a letter when provided
        if (item.description.trim() && !containsLetter(item.description)) {
            errs[`items.${i}.description`] =
                'Description must contain at least one letter.';
        }

        if (item.notes.trim() && !containsLetter(item.notes)) {
            errs[`items.${i}.notes`] =
                'Notes must contain at least one letter.';
        }
    });

    return errs;
};

// ─── Number Input Guard ───────────────────────────────────────────────────────

/**
 * Blocks e, E, +, - from number inputs so only plain digits (and ".") pass through.
 * Attach to the `onKeyDown` prop of any <input type="number" />.
 */
export const blockInvalidNumberKeys = (
    e: React.KeyboardEvent<HTMLInputElement>,
) => {
    if (['e', 'E', '+', '-'].includes(e.key)) {
        e.preventDefault();
    }
};
