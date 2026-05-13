import { useState } from 'react';
import type { CartItem } from '@/types';
import { computeItemTotal, fmt, variantLabel } from '@/lib/quoteUtils';

interface Props {
    cart: CartItem[];
    onRemove: (index: number) => void;
    onEdit: (index: number) => void;
    onCheckout: () => void;
}

export function CartSidebar({ cart, onRemove, onEdit, onCheckout }: Props) {
    const [mobileOpen, setMobileOpen] = useState(false);
    const grandTotal = cart.reduce((s, item) => s + computeItemTotal(item), 0);

    const CartContent = () => (
        <>
            {/* Items */}
            <div
                className="overflow-y-auto px-4 py-2"
                style={{ maxHeight: 'min(380px, 50vh)' }}
            >
                {cart.length === 0 ? (
                    <div className="py-8 text-center text-slate-400">
                        <div className="mb-2 text-[28px]">🛒</div>
                        <p className="mb-0.5 text-[12px] font-semibold">
                            No items yet
                        </p>
                        <p className="text-[11px]">
                            Configure a product to start
                        </p>
                    </div>
                ) : (
                    cart.map((item, i) => {
                        const subtotal = computeItemTotal(item);
                        return (
                            <div
                                key={item._id}
                                className="py-2.5"
                                style={{
                                    borderBottom:
                                        i < cart.length - 1
                                            ? '1px solid #f8fafc'
                                            : 'none',
                                }}
                            >
                                <div className="flex items-start justify-between gap-2">
                                    <div className="min-w-0 flex-1">
                                        <p className="mb-0.5 text-[12px] font-bold text-slate-900">
                                            {item.product.name}
                                        </p>

                                        {/* Size label */}
                                        {item.size_mode === 'standard' &&
                                        item.variant ? (
                                            <p
                                                className="mb-1 text-[10px] font-semibold"
                                                style={{ color: '#2c5282' }}
                                            >
                                                📐 {variantLabel(item.variant)}
                                            </p>
                                        ) : item.width ? (
                                            <p className="mb-1 text-[10px] text-slate-400">
                                                {item.product.unit === 'sqm'
                                                    ? `${item.width}m × ${item.height}m`
                                                    : `${item.width}m`}
                                                {item.thickness
                                                    ? ` · ${item.thickness}mm`
                                                    : ''}
                                            </p>
                                        ) : null}

                                        {/* Option badges */}
                                        {item.selected_options.length > 0 && (
                                            <div className="mb-1 flex flex-wrap gap-1">
                                                {item.selected_options.map(
                                                    (o) => (
                                                        <span
                                                            key={
                                                                o.product_option_id
                                                            }
                                                            className="rounded px-1.5 py-0.5 text-[9px] font-semibold"
                                                            style={{
                                                                background:
                                                                    '#eef2f8',
                                                                color: '#2c5282',
                                                            }}
                                                        >
                                                            {o.option_name}
                                                        </span>
                                                    ),
                                                )}
                                            </div>
                                        )}

                                        <p className="text-[10px] text-slate-400">
                                            {item.pieces} pc
                                            {item.pieces !== 1 ? 's' : ''}
                                        </p>
                                    </div>

                                    <div className="flex-shrink-0 text-right">
                                        <p
                                            className="text-[13px] font-extrabold"
                                            style={{ color: '#2c5282' }}
                                        >
                                            ₱{fmt(Math.round(subtotal))}
                                        </p>
                                        <div className="mt-1 flex justify-end gap-1">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    onEdit(i);
                                                    setMobileOpen(false);
                                                }}
                                                className="cursor-pointer border-none bg-none p-0 text-[10px] font-bold hover:underline"
                                                style={{
                                                    color: '#2c5282',
                                                    background: 'none',
                                                }}
                                            >
                                                Edit
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => onRemove(i)}
                                                className="cursor-pointer border-none p-0 text-[10px] font-bold hover:underline"
                                                style={{
                                                    color: '#dc2626',
                                                    background: 'none',
                                                }}
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Footer */}
            {cart.length > 0 && (
                <div
                    className="px-4 py-4"
                    style={{ borderTop: '1.5px solid #f1f5f9' }}
                >
                    <div className="mb-3 flex items-baseline justify-between">
                        <span className="text-[12px] font-semibold text-slate-500">
                            Estimated Total
                        </span>
                        <span
                            className="text-[18px] font-extrabold"
                            style={{ color: '#2c5282' }}
                        >
                            ₱{fmt(Math.round(grandTotal))}
                        </span>
                    </div>
                    <button
                        type="button"
                        onClick={() => {
                            onCheckout();
                            setMobileOpen(false);
                        }}
                        className="w-full cursor-pointer rounded-xl py-3.5 text-[13px] font-bold text-white transition-opacity hover:opacity-90"
                        style={{ background: '#2c5282', border: 'none' }}
                    >
                        Request Inspection →
                    </button>
                    <p className="mt-2 text-center text-[10px] leading-relaxed text-slate-400">
                        Final price confirmed after free on-site visit
                    </p>
                </div>
            )}
        </>
    );

    return (
        <>
            {/* ── DESKTOP: sticky sidebar ── */}
            <div className="sticky top-24 hidden w-72 flex-shrink-0 self-start lg:block xl:w-80">
                <div
                    className="overflow-hidden rounded-2xl"
                    style={{
                        background: 'white',
                        border: '1.5px solid #e2e8f0',
                        boxShadow: '0 4px 24px rgba(44,82,130,0.08)',
                    }}
                >
                    {/* Header */}
                    <div
                        className="flex items-center justify-between px-5 py-4 bg-primary"
                    >
                        <span className="text-[14px] font-bold text-white">
                            Your Quote
                        </span>
                        {cart.length > 0 && (
                            <span
                                className="rounded-full px-2.5 py-0.5 text-[11px] font-bold text-white"
                                style={{ background: 'rgba(255,255,255,0.2)' }}
                            >
                                {cart.length} item{cart.length !== 1 ? 's' : ''}
                            </span>
                        )}
                    </div>
                    <CartContent />
                </div>
            </div>

            {/* ── MOBILE: floating cart button + bottom sheet ── */}
            <div className="lg:hidden">
                {/* Floating button — only shown when cart has items */}
                {cart.length > 0 && (
                    <button
                        type="button"
                        onClick={() => setMobileOpen(true)}
                        className="fixed right-4 bottom-5 z-40 flex cursor-pointer items-center gap-2.5 rounded-2xl px-4 py-3 text-[13px] font-bold text-white shadow-2xl"
                        style={{ background: '#2c5282', border: 'none' }}
                    >
                        🛒
                        <span>
                            {cart.length} item{cart.length !== 1 ? 's' : ''}
                        </span>
                        <span className="opacity-80">·</span>
                        <span>₱{fmt(Math.round(grandTotal))}</span>
                    </button>
                )}

                {/* Bottom sheet overlay */}
                {mobileOpen && (
                    <div
                        className="fixed inset-0 z-50 flex flex-col justify-end"
                        style={{ background: 'rgba(0,0,0,0.45)' }}
                        onClick={(e) => {
                            if (e.target === e.currentTarget)
                                setMobileOpen(false);
                        }}
                    >
                        <div
                            className="overflow-hidden rounded-t-3xl"
                            style={{
                                background: 'white',
                                boxShadow: '0 -8px 40px rgba(0,0,0,0.2)',
                                maxHeight: '85vh',
                                display: 'flex',
                                flexDirection: 'column',
                            }}
                        >
                            {/* Sheet handle + header */}
                            <div
                                className="flex flex-shrink-0 items-center justify-between px-5 py-4"
                                style={{
                                    background:
                                        'linear-gradient(135deg,#1a2332,#2c5282)',
                                }}
                            >
                                <span className="text-[14px] font-bold text-white">
                                    Your Quote
                                </span>
                                <button
                                    type="button"
                                    onClick={() => setMobileOpen(false)}
                                    className="cursor-pointer border-none bg-none text-[20px] leading-none text-white opacity-70"
                                    style={{ background: 'none' }}
                                >
                                    ×
                                </button>
                            </div>
                            <div className="flex-1 overflow-y-auto">
                                <CartContent />
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}
