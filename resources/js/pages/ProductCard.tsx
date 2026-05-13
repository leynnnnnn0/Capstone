import { useState } from 'react';
import type { Product } from '@/types';
import { fmt, productGradient } from '@/lib/quoteUtils';

interface Props {
    product: Product;
    index: number;
    onSelect: (product: Product) => void;
}

export function ProductCard({ product, index, onSelect }: Props) {
    const [hovered, setHovered] = useState(false);
    const gradient = productGradient(index);
    const coverImage = product.product_images?.[0]?.url ?? null;

    return (
        <button
            type="button"
            onClick={() => onSelect(product)}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            className="group w-full overflow-hidden rounded-2xl bg-white text-left transition-all duration-200 outline-none"
            style={{
                border: `1.5px solid ${hovered ? '#2c5282' : '#e2e8f0'}`,
                boxShadow: hovered
                    ? '0 12px 32px rgba(44,82,130,0.15)'
                    : '0 2px 8px rgba(0,0,0,0.05)',
                transform: hovered ? 'translateY(-3px)' : 'translateY(0)',
            }}
        >
            {/* Illustration / image area */}
            <div
                className="relative flex h-24 items-center justify-center overflow-hidden sm:h-28"
                style={{ background: gradient }}
            >
                {coverImage ? (
                    <img
                        src={coverImage}
                        alt={product.name}
                        className="h-full w-full object-cover"
                    />
                ) : (
                    <ProductSvg index={index} />
                )}
            </div>

            {/* Info */}
            <div className="p-3 sm:p-3.5">
                <p className="mb-0.5 text-[13px] leading-tight font-bold text-slate-900">
                    {product.name}
                </p>
                <p className="mb-2 line-clamp-2 hidden text-[11px] leading-relaxed text-slate-500 sm:block">
                    {product.description}
                </p>
                <p className="text-[11px] font-bold text-[#2c5282]">
                    from ₱{fmt(product.price_per_unit)}
                    <span className="font-normal text-slate-400">
                        /{product.unit}
                    </span>
                </p>
            </div>
        </button>
    );
}

// ─── SVG fallback illustrations ──────────────────────────────────────────────

function ProductSvg({ index }: { index: number }) {
    const svgs = [
        <svg
            key={0}
            viewBox="0 0 120 120"
            className="h-12 w-12 opacity-90 sm:h-14 sm:w-14"
            fill="none"
        >
            <rect
                x="10"
                y="15"
                width="46"
                height="90"
                rx="4"
                fill="rgba(255,255,255,0.15)"
                stroke="rgba(255,255,255,0.5)"
                strokeWidth="2"
            />
            <rect
                x="64"
                y="15"
                width="46"
                height="90"
                rx="4"
                fill="rgba(255,255,255,0.1)"
                stroke="rgba(255,255,255,0.35)"
                strokeWidth="2"
            />
            <rect
                x="13"
                y="25"
                width="12"
                height="65"
                rx="2"
                fill="rgba(255,255,255,0.25)"
            />
            <rect
                x="67"
                y="25"
                width="12"
                height="65"
                rx="2"
                fill="rgba(255,255,255,0.2)"
            />
            <rect
                x="52"
                y="55"
                width="16"
                height="10"
                rx="3"
                fill="rgba(255,255,255,0.7)"
            />
            <line
                x1="10"
                y1="108"
                x2="110"
                y2="108"
                stroke="rgba(255,255,255,0.4)"
                strokeWidth="3"
                strokeLinecap="round"
            />
        </svg>,
        <svg
            key={1}
            viewBox="0 0 120 120"
            className="h-12 w-12 opacity-90 sm:h-14 sm:w-14"
            fill="none"
        >
            <rect
                x="20"
                y="10"
                width="58"
                height="100"
                rx="4"
                fill="rgba(255,255,255,0.15)"
                stroke="rgba(255,255,255,0.5)"
                strokeWidth="2"
            />
            <rect
                x="25"
                y="18"
                width="14"
                height="75"
                rx="2"
                fill="rgba(255,255,255,0.3)"
            />
            <circle
                cx="72"
                cy="60"
                r="6"
                fill="rgba(255,255,255,0.8)"
                stroke="rgba(255,255,255,0.9)"
                strokeWidth="1.5"
            />
            <path
                d="M78 60 Q96 50 96 30"
                stroke="rgba(255,255,255,0.3)"
                strokeWidth="1.5"
                strokeDasharray="4 3"
            />
        </svg>,
        <svg
            key={2}
            viewBox="0 0 120 120"
            className="h-12 w-12 opacity-90 sm:h-14 sm:w-14"
            fill="none"
        >
            <rect
                x="10"
                y="20"
                width="100"
                height="80"
                rx="6"
                fill="rgba(255,255,255,0.2)"
                stroke="rgba(44,82,130,0.6)"
                strokeWidth="2.5"
            />
            <rect
                x="10"
                y="57"
                width="100"
                height="6"
                fill="rgba(44,82,130,0.4)"
            />
            <rect
                x="57"
                y="20"
                width="6"
                height="80"
                fill="rgba(44,82,130,0.4)"
            />
            <rect
                x="16"
                y="26"
                width="14"
                height="28"
                rx="2"
                fill="rgba(255,255,255,0.4)"
            />
            <rect
                x="66"
                y="26"
                width="14"
                height="28"
                rx="2"
                fill="rgba(255,255,255,0.35)"
            />
        </svg>,
        <svg
            key={3}
            viewBox="0 0 120 120"
            className="h-12 w-12 opacity-90 sm:h-14 sm:w-14"
            fill="none"
        >
            <rect
                x="14"
                y="15"
                width="26"
                height="90"
                rx="4"
                fill="rgba(255,255,255,0.2)"
                stroke="rgba(255,255,255,0.5)"
                strokeWidth="1.5"
            />
            <rect
                x="47"
                y="15"
                width="26"
                height="90"
                rx="4"
                fill="rgba(255,255,255,0.15)"
                stroke="rgba(255,255,255,0.4)"
                strokeWidth="1.5"
            />
            <rect
                x="80"
                y="15"
                width="26"
                height="90"
                rx="4"
                fill="rgba(255,255,255,0.1)"
                stroke="rgba(255,255,255,0.35)"
                strokeWidth="1.5"
            />
        </svg>,
        <svg
            key={4}
            viewBox="0 0 120 120"
            className="h-12 w-12 opacity-90 sm:h-14 sm:w-14"
            fill="none"
        >
            <rect
                x="14"
                y="14"
                width="92"
                height="92"
                rx="6"
                fill="rgba(255,255,255,0.1)"
                stroke="rgba(255,255,255,0.4)"
                strokeWidth="2"
            />
            <rect
                x="14"
                y="60"
                width="92"
                height="4"
                fill="rgba(255,255,255,0.35)"
            />
            <rect
                x="34"
                y="32"
                width="22"
                height="8"
                rx="4"
                fill="rgba(255,255,255,0.5)"
            />
            <rect
                x="34"
                y="72"
                width="22"
                height="8"
                rx="4"
                fill="rgba(255,255,255,0.5)"
            />
            <rect
                x="64"
                y="32"
                width="22"
                height="8"
                rx="4"
                fill="rgba(255,255,255,0.4)"
            />
            <rect
                x="64"
                y="72"
                width="22"
                height="8"
                rx="4"
                fill="rgba(255,255,255,0.4)"
            />
        </svg>,
        <svg
            key={5}
            viewBox="0 0 120 120"
            className="h-12 w-12 opacity-90 sm:h-14 sm:w-14"
            fill="none"
        >
            <rect
                x="18"
                y="10"
                width="6"
                height="100"
                rx="3"
                fill="rgba(255,255,255,0.4)"
            />
            <rect
                x="96"
                y="10"
                width="6"
                height="100"
                rx="3"
                fill="rgba(255,255,255,0.4)"
            />
            <rect
                x="18"
                y="28"
                width="84"
                height="5"
                rx="2.5"
                fill="rgba(255,255,255,0.55)"
            />
            <rect
                x="18"
                y="55"
                width="84"
                height="5"
                rx="2.5"
                fill="rgba(255,255,255,0.5)"
            />
            <rect
                x="18"
                y="82"
                width="84"
                height="5"
                rx="2.5"
                fill="rgba(255,255,255,0.45)"
            />
        </svg>,
    ];
    return svgs[index % svgs.length];
}
