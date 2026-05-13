import type { CartItem, QuoteItemPayload } from './types';

let _uid = 1;
export function nextId(): number {
    return _uid++;
}

export function fmt(n: number): string {
    return Number(n).toLocaleString('en-PH', { minimumFractionDigits: 0 });
}

export function parseNum(v: string): number {
    return parseFloat(v) || 0;
}

/**
 * Compute estimated total for a single CartItem.
 *
 * Standard variant:
 *   (variant.price + sum(options)) × pieces
 *   — variant.price is already a flat price for that exact size,
 *     NOT a per-sqm rate. Width/height are stored for reference only.
 *
 * Custom dimensions:
 *   unit = sqm   → (price_per_unit + options) × (w × h) × pieces
 *   unit = meter → (price_per_unit + options) × length  × pieces
 *   unit = piece | set → (price_per_unit + options) × pieces
 */
export function computeItemTotal(item: CartItem): number {
    console.log('Computing total for item', item);
    const optionsAmount = item.selected_options.reduce(
        (s, o) => s + Number(o.price_modifier),
        0,
    );

    if (item.size_mode === 'standard' && item.variant) {
        // variant.price = flat price for this size (not per-unit rate)
        return (Number(item.variant.price) + optionsAmount) * item.pieces;
    }

    // Custom / no-variant path
    const pricePerUnit = Number(item.product.price_per_unit);
    const w = parseNum(item.width);
    const h = parseNum(item.height);

    let measure: number;
    switch (item.product.unit) {
        case 'sqm':
            measure = w * h;
            break;
        case 'sqft':
            measure = w * h;
            break;
        case 'meter':
            measure = w;
            break;
        default:
            measure = 1; // piece / set
    }

    return (pricePerUnit + optionsAmount) * measure * item.pieces;
}

/**
 * amount_per_piece = total ÷ pieces
 * (the value stored per QuotationItem row — before the pieces multiplier)
 */
export function computeAmountPerPiece(item: CartItem): number {
    const pieces = Math.max(item.pieces, 1);
    return computeItemTotal(item) / pieces;
}

/** Convert CartItem → backend payload */
export function cartItemToPayload(item: CartItem): QuoteItemPayload {
    const optionsAmount = item.selected_options.reduce(
        (s, o) => s + Number(o.price_modifier),
        0,
    );
    const amountPerPiece = computeAmountPerPiece(item);
    const totalAmount = amountPerPiece * item.pieces;

    return {
        product_id: item.product.id,
        name: item.product.name,
        description: item.product.description,
        width: parseNum(item.width) || null,
        height: parseNum(item.height) || null,
        thickness: parseNum(item.thickness) || null,
        pieces: item.pieces,
        amount_per_piece: amountPerPiece,
        options_amount: optionsAmount,
        total_amount: totalAmount,
        notes: '',
        selected_options: item.selected_options,
    };
}

/** Gradient by product index (cycles through 6) */
const GRADIENTS = [
    'linear-gradient(135deg,#1a2332,#2c5282)',
    'linear-gradient(135deg,#2c5282,#6a8fa8)',
    'linear-gradient(135deg,#4a7291,#608DB9)',
    'linear-gradient(135deg,#1a2332,#4a7291)',
    'linear-gradient(135deg,#162d4a,#2c5282)',
    'linear-gradient(135deg,#0f2440,#3b6fa0)',
];
export function productGradient(index: number): string {
    return GRADIENTS[index % GRADIENTS.length];
}

/** "600 × 2000 mm" from variant width/height (stored in meters) */
export function variantLabel(v: { width: number; height: number }): string {
    return `${Math.round(Number(v.width) * 1000)} × ${Math.round(Number(v.height) * 1000)} mm`;
}
