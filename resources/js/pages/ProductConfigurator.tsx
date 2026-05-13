import { useState, useEffect } from 'react';
import type {
    CartItem,
    Product,
    ProductVariant,
    SelectedOption,
    SizeMode,
} from '@/types';
import { nextId, productGradient } from '@/lib/quoteUtils';
import { ProductCard } from './ProductCard';
import { OptionGroupPicker } from './OptionGroupPicker';
import { VariantPicker } from './VariantPicker';
import { DimensionInputs } from './DimensionInput';
import { LivePriceBar } from './LivePriceBar';
import { usePage } from '@inertiajs/react';

interface Props {
    products: Product[];
    editingItem: CartItem | null;
    onAdd: (item: CartItem) => void;
    onUpdate: (item: CartItem) => void;
    onCancelEdit: () => void;
    preSelectedProduct: number | null;
    preSelectedProductVariant: number | null;
}

interface DraftState {
    product: Product;
    selected_options: SelectedOption[];
    size_mode: SizeMode;
    variant: ProductVariant | null;
    width: string;
    height: string;
    thickness: string;
    pieces: number;
}

function blankDraft(product: Product): DraftState {
    return {
        product,
        selected_options: [],
        size_mode: product.product_variants.length > 0 ? 'standard' : 'custom',
        variant: null,
        width: '',
        height: '',
        thickness: '',
        pieces: 1,
    };
}

function draftFromItem(item: CartItem): DraftState {
    return {
        product: item.product,
        selected_options: [...item.selected_options],
        size_mode: item.size_mode,
        variant: item.variant,
        width: item.width,
        height: item.height,
        thickness: item.thickness,
        pieces: item.pieces,
    };
}

export default function ProductConfigurator({
    products,
    preSelectedProduct,
    preSelectedProductVariant,
    editingItem,
    onAdd,
    onUpdate,
    onCancelEdit,
}: Props) {
    const [step, setStep] = useState<1 | 2>(editingItem ? 2 : 1);
    const [draft, setDraft] = useState<DraftState>(
        editingItem
            ? draftFromItem(editingItem)
            : blankDraft(products[0] ?? ({} as Product)),
    );
    const page = usePage();
    console.log(page);

    // ── Fix edit bug: re-sync draft whenever editingItem changes ─────────────
    useEffect(() => {
        if (editingItem) {
            setDraft(draftFromItem(editingItem));
            setStep(2);
        } else {
            // Editing cancelled — go back to product picker with a fresh draft
            setStep(1);
            if (products.length > 0) setDraft(blankDraft(products[0]));
        }
    }, [editingItem]);

    useEffect(() => {
        if (preSelectedProduct && products?.length) {
            const selected = products.find((p) => p.id == preSelectedProduct);

            if (selected) {
                pickProduct(selected);

                if (preSelectedProductVariant && draft.product.product_variants) {
                    const selected = draft.product.product_variants.find(p => p.id == preSelectedProductVariant);

                    if (selected) {
                        handleVariantSelect(selected);
                   }
                }
            }
        }
    }, [preSelectedProduct, products]);

    // ── Validation ───────────────────────────────────────────────────────────
    const requiredGroups = (draft.product?.product_option_groups ?? []).filter(
        (g) => g.is_required,
    );
    const allRequiredSelected = requiredGroups.every((g) =>
        draft.selected_options.some((s) => s.product_option_group_id === g.id),
    );

    const hasVariants = (draft.product?.product_variants?.length ?? 0) > 0;

    // For standard mode: variant must be chosen. For custom: check dims.
    const sizeReady =
        draft.size_mode === 'standard'
            ? !!draft.variant
            : draft.product?.unit === 'sqm'
              ? parseFloat(draft.width) > 0 && parseFloat(draft.height) > 0
              : draft.product?.unit === 'meter'
                ? parseFloat(draft.width) > 0
                : true;

    const canSubmit = allRequiredSelected && sizeReady;

    // ── Handlers ─────────────────────────────────────────────────────────────
    const pickProduct = (p: Product) => {
        setDraft(blankDraft(p));
        setStep(2);
    };

    const handleVariantSelect = (v: ProductVariant | null) => {
        setDraft((d) => ({
            ...d,
            variant: v,
            // Pre-fill dims from variant so they're always sent to backend
            width: v ? v.width.toString() : '',
            height: v ? v.height.toString() : '',
        }));
    };

    const handleSubmit = () => {
        if (!canSubmit) return;
        const item: CartItem = { _id: editingItem?._id ?? nextId(), ...draft };
        if (editingItem) {
            onUpdate(item);
        } else {
            onAdd(item);
            setDraft(blankDraft(products[0]));
            setStep(1);
        }
    };

    // ─────────────────────────────────────────────────────────────────────────
    // STEP 1 — Product grid
    // ─────────────────────────────────────────────────────────────────────────
    if (step === 1) {
        return (
            <div className="min-w-0 flex-1">
                <div className="mb-5 sm:mb-7">
                    <h2 className="mb-1.5 text-[22px] font-bold text-secondary sm:text-[28px]">
                        {editingItem ? 'Change product' : 'Add a product'}
                    </h2>
                    <p className="text-[13px] text-slate-500 sm:text-[14px]">
                        Select what you'd like to include in your quote.
                    </p>
                </div>

                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3">
                    {products.map((p, i) => (
                        <ProductCard
                            key={p.id}
                            product={p}
                            index={i}
                            onSelect={pickProduct}
                        />
                    ))}
                </div>

                {editingItem && (
                    <button
                        type="button"
                        onClick={onCancelEdit}
                        className="mt-4 cursor-pointer rounded-xl bg-transparent px-5 py-2.5 text-[13px] font-bold text-slate-500 transition-colors hover:bg-slate-100"
                        style={{ border: '1.5px solid #e2e8f0' }}
                    >
                        Cancel
                    </button>
                )}
            </div>
        );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // STEP 2 — Configure product
    // ─────────────────────────────────────────────────────────────────────────
    const productIdx = products.findIndex((p) => p.id === draft.product?.id);

    return (
        <div className="min-w-0 flex-1">
            {/* Breadcrumb */}
            <div className="mb-5 flex items-center gap-3">
                <button
                    type="button"
                    onClick={() => {
                        setStep(1);
                        if (!editingItem) setDraft(blankDraft(products[0]));
                    }}
                    className="cursor-pointer rounded-lg border-none bg-slate-100 px-3 py-1.5 text-[12px] font-bold text-slate-500 transition-colors hover:bg-slate-200"
                >
                    ← Products
                </button>
                {editingItem && (
                    <span
                        className="ml-auto rounded-lg px-3 py-1 text-[11px] font-bold"
                        style={{ background: '#eef2f8', color: '#608DB9' }}
                    >
                        Editing item
                    </span>
                )}
            </div>

            {/* Product identity bar */}
            <div
                className="mb-5 flex items-center gap-3 rounded-2xl p-3 sm:gap-4"
                style={{ background: 'white', border: '1.5px solid #e2e8f0' }}
            >
                {/* Cover image or gradient swatch */}
                {draft.product?.product_images?.[0]?.url ? (
                    <img
                        src={draft.product.product_images[0].url}
                        alt={draft.product.name}
                        className="h-12 w-12 flex-shrink-0 rounded-xl object-cover"
                    />
                ) : (
                    <div
                        className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl"
                        style={{ background: productGradient(productIdx) }}
                    >
                        <span className="text-[11px] font-bold text-white opacity-80">
                            {draft.product?.name?.slice(0, 2).toUpperCase()}
                        </span>
                    </div>
                )}
                <div className="min-w-0">
                    <p className="mb-0.5 truncate text-[15px] font-bold text-slate-900 sm:text-[16px]">
                        {draft.product?.name}
                    </p>
                    <p className="line-clamp-1 text-[11px] text-slate-500 sm:text-[12px]">
                        {draft.product?.description}
                    </p>
                </div>
            </div>

            {/* ── OPTIONS ── */}
            {(draft.product?.product_option_groups?.length ?? 0) > 0 && (
                <section className="mb-5">
                    <p className="mb-2.5 text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                        Options
                        {requiredGroups.length > 0 && (
                            <span className="ml-1.5 font-normal normal-case">
                                (
                                <span
                                    className="mx-0.5 inline-block h-1.5 w-1.5 rounded-full align-middle"
                                    style={{ background: '#608DB9' }}
                                />{' '}
                                = required)
                            </span>
                        )}
                    </p>
                    {/* Single column on mobile, 2 cols on sm+ */}
                    <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                        {draft.product.product_option_groups.map((g) => (
                            <OptionGroupPicker
                                key={g.id}
                                groups={[g]}
                                selected={draft.selected_options}
                                onChange={(updated) =>
                                    setDraft((d) => ({
                                        ...d,
                                        selected_options: updated,
                                    }))
                                }
                            />
                        ))}
                    </div>
                </section>
            )}

            {/* ── SIZE ── */}
            <section className="mb-5">
                <p className="mb-2.5 text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                    Size
                </p>

                {/* Standard / Custom toggle — only if variants exist */}
                {hasVariants && (
                    <div className="mb-3 flex flex-wrap gap-2">
                        {[
                            {
                                key: 'standard' as SizeMode,
                                label: '📐 Standard Sizes',
                            },
                            {
                                key: 'custom' as SizeMode,
                                label: '✏️ Custom Dimensions',
                            },
                        ].map((m) => (
                            <button
                                key={m.key}
                                type="button"
                                onClick={() =>
                                    setDraft((d) => ({
                                        ...d,
                                        size_mode: m.key,
                                        variant: null,
                                        width: '',
                                        height: '',
                                    }))
                                }
                                className="cursor-pointer rounded-xl px-3 py-2 text-[12px] font-bold transition-all sm:px-4"
                                style={{
                                    background:
                                        draft.size_mode === m.key
                                            ? '#608DB9'
                                            : 'white',
                                    color:
                                        draft.size_mode === m.key
                                            ? 'white'
                                            : '#64748b',
                                    border:
                                        draft.size_mode === m.key
                                            ? '2px solid #608DB9'
                                            : '1.5px solid #e2e8f0',
                                }}
                            >
                                {m.label}
                            </button>
                        ))}
                    </div>
                )}

                {/* Variant cards */}
                {draft.size_mode === 'standard' && hasVariants && (
                    <div className="mb-4">
                        <VariantPicker
                            variants={draft.product.product_variants}
                            selected={draft.variant}
                            onSelect={handleVariantSelect}
                        />
                    </div>
                )}

                {/* Dimension inputs — ALWAYS shown below variant picker too */}
                {draft.size_mode == 'custom' && (
                    <DimensionInputs
                        product={draft.product}
                        dims={{
                            width: draft.width,
                            height: draft.height,
                            thickness: draft.thickness,
                        }}
                        onChange={({ width, height, thickness }) =>
                            setDraft((d) => ({
                                ...d,
                                width,
                                height,
                                thickness,
                            }))
                        }
                    />
                )}
            </section>

            {/* ── PIECES + LIVE PRICE ── */}
            <section className="mb-5">
                <LivePriceBar
                    item={{ _id: 0, ...draft }}
                    onPiecesChange={(n) =>
                        setDraft((d) => ({ ...d, pieces: n }))
                    }
                />
            </section>

            {/* ── CTA ── */}
            <div className="flex gap-3">
                {editingItem && (
                    <button
                        type="button"
                        onClick={onCancelEdit}
                        className="flex-shrink-0 cursor-pointer rounded-xl bg-transparent px-4 py-3.5 text-[13px] font-bold text-slate-500 transition-colors hover:bg-slate-50 sm:px-5"
                        style={{ border: '1.5px solid #e2e8f0' }}
                    >
                        Cancel
                    </button>
                )}
                <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={!canSubmit}
                    className="flex-1 rounded-xl py-3.5 text-[14px] font-bold transition-all duration-200"
                    style={{
                        cursor: canSubmit ? 'pointer' : 'not-allowed',
                        background: canSubmit ? '#608DB9' : '#e2e8f0',
                        color: canSubmit ? 'white' : '#94a3b8',
                        border: 'none',
                    }}
                >
                    {editingItem ? 'Update Item ✓' : '+ Add to Quote'}
                </button>
            </div>

            {!canSubmit && (
                <p className="mt-2 text-center text-[11px] text-slate-400">
                    {!allRequiredSelected
                        ? 'Select all required options first'
                        : !sizeReady
                          ? 'Choose or enter a size to continue'
                          : ''}
                </p>
            )}
        </div>
    );
}
