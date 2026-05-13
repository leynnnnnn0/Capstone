import type { ProductVariant } from '@/types';
import { fmt, variantLabel } from '@/lib/quoteUtils';

interface Props {
    variants: ProductVariant[];
    selected: ProductVariant | null;
    /** onSelect now also passes width/height strings back so parent keeps dims in sync */
    onSelect: (variant: ProductVariant | null) => void;
}

export function VariantPicker({ variants, selected, onSelect }: Props) {
    if (variants.length === 0) return null;

    return (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {variants.map((v) => {
                const active = selected?.id === v.id;
                const img = v.product_variant_images?.[0]?.url ?? null;

                return (
                    <button
                        key={v.id}
                        type="button"
                        onClick={() => onSelect(active ? null : v)}
                        className="cursor-pointer overflow-hidden rounded-xl text-center transition-all duration-150"
                        style={{
                            background: active ? '#eef2f8' : 'white',
                            border: active
                                ? '2px solid #2c5282'
                                : '1.5px solid #e2e8f0',
                        }}
                    >
                        {/* Variant image (if exists) */}
                        {img && (
                            <div className="h-16 overflow-hidden">
                                <img
                                    src={img}
                                    alt={variantLabel(v)}
                                    className="h-full w-full object-cover"
                                />
                            </div>
                        )}

                        <div className="p-2.5">
                            <p
                                className="mb-0.5 text-[11px] leading-tight font-bold"
                                style={{
                                    color: active ? '#2c5282' : '#1a202c',
                                }}
                            >
                                {variantLabel(v)}
                            </p>
                            <p className="mb-1 text-[10px] text-slate-400">
                                {v.width}m × {v.height}m
                            </p>
                            <p className="text-[13px] font-extrabold text-[#2c5282]">
                                ₱{fmt(v.price)}
                            </p>
                        </div>
                    </button>
                );
            })}
        </div>
    );
}
