import { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import Navbar from '../Navbar';
import Footer from '../Footer';

// ─── Types ───────────────────────────────────────────────────────────────────

interface ProductImage {
    id: number;
    url: string;
}
interface VariantImage {
    id: number;
    url: string;
}
interface Category {
    id: number;
    name: string;
}

interface ProductOption {
    id: number;
    name: string;
    price_modifier: number;
}

interface ProductOptionGroup {
    id: number;
    name: string;
    is_required: boolean;
    product_options: ProductOption[];
}

interface ProductVariant {
    id: number;
    width: number;
    height: number;
    price: number;
    product_variant_images: VariantImage[];
}

interface Product {
    id: number;
    name: string;
    description: string;
    unit: string;
    price_per_unit: number;
    product_images: ProductImage[];
    product_variants: ProductVariant[];
    product_option_groups: ProductOptionGroup[];
    categories: Category[];
}

interface RelatedProduct {
    id: number;
    name: string;
    description: string;
    unit: string;
    price_per_unit: number;
    product_images: ProductImage[];
    categories: Category[];
}

interface Props {
    product: Product;
    related: RelatedProduct[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmt(n: number) {
    return Number(n).toLocaleString('en-PH', { minimumFractionDigits: 0 });
}

function variantLabel(v: ProductVariant): string {
    return `${Math.round(v.width * 1000)} × ${Math.round(v.height * 1000)} mm`;
}

const GRADIENTS = [
    'linear-gradient(135deg,#1a2332,#2c5282)',
    'linear-gradient(135deg,#2c5282,#6a8fa8)',
    'linear-gradient(135deg,#4a7291,#608DB9)',
];

// ─── Image Gallery ────────────────────────────────────────────────────────────

function ImageGallery({
    images,
    productName,
}: {
    images: ProductImage[];
    productName: string;
}) {
    const [active, setActive] = useState(0);
    const [zoomed, setZoomed] = useState(false);

    if (images.length === 0) {
        return (
            <div
                className="flex aspect-square w-full items-center justify-center rounded-3xl"
                style={{
                    background: 'linear-gradient(135deg,#1a2332,#2c5282)',
                }}
            >
                <span className="text-[48px] font-black text-white opacity-20">
                    {productName.slice(0, 2).toUpperCase()}
                </span>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-4">
            {/* Main image */}
            <div
                className="relative aspect-square w-full cursor-zoom-in overflow-hidden rounded-3xl border border-slate-100 bg-slate-50"
                onClick={() => setZoomed(true)}
            >
                <img
                    src={images[active].url}
                    alt={productName}
                    className="h-full w-full object-contain p-4 transition-all duration-500 sm:p-8"
                />

                {/* Counter top-right */}
                {images.length > 1 && (
                    <div className="absolute top-4 right-4 flex items-baseline gap-1">
                        <span className="text-[20px] font-black text-slate-900">
                            {String(active + 1).padStart(2, '0')}
                        </span>
                        <span className="text-[14px] font-medium text-slate-400">
                            / {String(images.length).padStart(2, '0')}
                        </span>
                    </div>
                )}

                {/* Prev / Next arrows */}
                {images.length > 1 && (
                    <>
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                setActive(
                                    (a) =>
                                        (a - 1 + images.length) % images.length,
                                );
                            }}
                            className="absolute top-1/2 left-3 flex h-9 w-9 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-slate-100 bg-white text-slate-500 shadow-md transition hover:text-slate-900"
                        >
                            ‹
                        </button>
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                setActive((a) => (a + 1) % images.length);
                            }}
                            className="absolute top-1/2 right-3 flex h-9 w-9 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-slate-100 bg-white text-slate-500 shadow-md transition hover:text-slate-900"
                        >
                            ›
                        </button>
                    </>
                )}
            </div>

            {/* Thumbnails */}
            {images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-1">
                    {images.map((img, i) => (
                        <button
                            key={img.id}
                            type="button"
                            onClick={() => setActive(i)}
                            className="h-16 w-16 flex-shrink-0 cursor-pointer overflow-hidden rounded-xl border-2 transition-all sm:h-20 sm:w-20"
                            style={{
                                borderColor:
                                    active === i ? '#608DB9' : '#e2e8f0',
                            }}
                        >
                            <img
                                src={img.url}
                                alt={`${productName} view ${i + 1}`}
                                className="h-full w-full object-cover"
                            />
                        </button>
                    ))}
                </div>
            )}

            {/* Lightbox */}
            {zoomed && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
                    onClick={() => setZoomed(false)}
                >
                    <img
                        src={images[active].url}
                        alt={productName}
                        className="max-h-full max-w-full rounded-2xl object-contain"
                        onClick={(e) => e.stopPropagation()}
                    />
                    <button
                        type="button"
                        className="absolute top-5 right-5 cursor-pointer border-none bg-none text-2xl text-white"
                        onClick={() => setZoomed(false)}
                    >
                        ×
                    </button>
                </div>
            )}
        </div>
    );
}

// ─── Variant Row (inspired by image 2 — adapted for appointments) ─────────────

function VariantRow({
    variant,
    productName,
    productId,
}: {
    variant: ProductVariant;
    productName: string;
    productId: number;
}) {
    const img = variant.product_variant_images?.[0]?.url ?? null;

    return (
        <div className="flex items-center gap-4 border-b border-slate-100 py-4 last:border-0">
            {/* Thumbnail */}
            <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl border border-slate-100 bg-slate-50 sm:h-20 sm:w-20">
                {img ? (
                    <img
                        src={img}
                        alt={variantLabel(variant)}
                        className="h-full w-full object-cover"
                    />
                ) : (
                    <div
                        className="flex h-full w-full items-center justify-center"
                        style={{
                            background:
                                'linear-gradient(135deg,#1a2332,#2c5282)',
                        }}
                    >
                        <span className="text-[10px] font-bold text-white opacity-60">
                            {variantLabel(variant).split('×')[0].trim()}
                        </span>
                    </div>
                )}
            </div>

            {/* Info */}
            <div className="min-w-0 flex-1">
                <p className="mb-0.5 text-[13px] font-bold text-slate-900 sm:text-[14px]">
                    {productName}
                </p>
                <p className="mb-1 text-[11px] text-slate-400">
                    Size:{' '}
                    <span className="font-semibold text-slate-600">
                        {variantLabel(variant)}
                    </span>
                </p>
            </div>

            {/* Price + CTA */}
            <div className="flex flex-shrink-0 flex-col items-end gap-2">
                <p
                    className="text-[12px] font-extrabold sm:text-[18px]"
                    style={{ color: '#608DB9' }}
                >
                    ₱{fmt(variant.price)}
                </p>
                <Link
                    href={`/get-quote?product=${productId}&variant=${variant.id}`}
                    className="rounded-xl px-2 py-1 text-[8px] font-bold whitespace-nowrap text-white no-underline transition-all hover:-translate-y-0.5 hover:opacity-90 sm:px-4 sm:text-[12px]"
                    style={{ background: '#608DB9' }}
                >
                    Request Quote
                </Link>
            </div>
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ProductShow({ product, related }: Props) {
    const basePrice = product.price_per_unit;

    return (
        <>
            <Head title={`${product.name} — SOG Glass & Aluminum`} />

            <div className="min-h-screen bg-white text-slate-900">
                <Navbar />

                {/* ── MAIN CONTENT ── */}
                <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
                    <div className="grid grid-cols-1 items-start gap-10 lg:grid-cols-2 lg:gap-20">
                        {/* LEFT — image gallery (right side in the reference image) */}
                        <div className="order-1 lg:sticky lg:top-24 lg:order-2">
                            <ImageGallery
                                images={product.product_images}
                                productName={product.name}
                            />
                        </div>

                        {/* RIGHT — info panel (left side in reference image) */}
                        <div className="order-2 lg:order-1">
                            {/* Category breadcrumb chip */}
                            {product.categories?.[0] && (
                                <div className="mb-3 flex items-center gap-2 text-[11px] text-slate-400">
                                    <Link
                                        href="/products"
                                        className="font-semibold transition-colors hover:text-primary"
                                    >
                                        {product.categories[0].name}
                                    </Link>
                                    <span>/</span>
                                    <span className="text-slate-600">
                                        {product.name}
                                    </span>
                                </div>
                            )}

                            {/* Title */}
                            <h1 className="mb-4 text-3xl leading-tight font-bold text-slate-900 sm:text-4xl">
                                {product.name}
                            </h1>

                            {/* Price */}
                            <div className="mb-5 flex items-baseline gap-3">
                                <span
                                    className="text-[26px] font-extrabold sm:text-[30px]"
                                    style={{ color: '#608DB9' }}
                                >
                                    ₱{fmt(basePrice)}
                                </span>
                                <span className="text-[13px] text-slate-400">
                                    per {product.unit}
                                </span>
                            </div>

                            {/* Description */}
                            <p className="mb-6 text-[14px] leading-relaxed text-slate-500 sm:text-[15px]">
                                {product.description}
                            </p>

                            {/* Option groups — shown as info chips (not interactive, just informational) */}
                            {product.product_option_groups.length > 0 && (
                                <div className="mb-6 space-y-4">
                                    {product.product_option_groups.map(
                                        (group) => (
                                            <div key={group.id}>
                                                <p className="mb-2 text-[11px] font-bold tracking-widest text-slate-400 uppercase">
                                                    {group.name}
                                                    {group.is_required && (
                                                        <span className="ml-1.5 text-primary">
                                                            *
                                                        </span>
                                                    )}
                                                </p>
                                                <div className="flex flex-wrap gap-2">
                                                    {group.product_options.map(
                                                        (opt) => (
                                                            <span
                                                                key={opt.id}
                                                                className="rounded-full border px-3 py-1 text-[12px] font-semibold text-slate-600"
                                                                style={{
                                                                    borderColor:
                                                                        '#e2e8f0',
                                                                }}
                                                            >
                                                                {opt.name}
                                                                {opt.price_modifier >
                                                                    0 && (
                                                                    <span className="ml-1 font-bold text-primary">
                                                                        +₱
                                                                        {fmt(
                                                                            opt.price_modifier,
                                                                        )}
                                                                    </span>
                                                                )}
                                                            </span>
                                                        ),
                                                    )}
                                                </div>
                                            </div>
                                        ),
                                    )}
                                </div>
                            )}

                            {/* Specs badges */}
                            <div className="mb-8 flex flex-wrap gap-2 border-b border-slate-100 pb-6">
                                {[
                                    {
                                        icon: '🏭',
                                        label: 'Fabricated In-House',
                                    },
                                    { icon: '🛡️', label: 'Warranty Included' },
                                    { icon: '📐', label: 'Free Measurement' },
                                    { icon: '⚡', label: '7–14 Day Lead Time' },
                                ].map((s) => (
                                    <span
                                        key={s.label}
                                        className="flex items-center gap-1.5 rounded-lg border border-slate-100 bg-slate-50 px-3 py-1.5 text-[11px] font-semibold text-slate-600"
                                    >
                                        <span>{s.icon}</span> {s.label}
                                    </span>
                                ))}
                            </div>

                            {/* CTAs */}
                            <div className="mb-6 flex flex-col gap-3 sm:flex-row">
                                <Link
                                    href={`/get-quote?product=${product.id}`}
                                    className="flex-1 rounded-xl py-4 text-center text-[14px] font-bold text-white no-underline transition-all hover:-translate-y-0.5 hover:opacity-90"
                                    style={{ background: '#608DB9' }}
                                >
                                    Get a Quote for This Product
                                </Link>
                            </div>

                            {/* Trust strip */}
                            <p className="text-center text-[11px] leading-relaxed text-slate-400">
                                Free 3–5 day scheduling · Tool-free consultation
                                · No obligation quote
                            </p>
                        </div>
                    </div>
                </div>

                {/* ── VARIANTS TABLE ── */}
                {product.product_variants.length > 0 && (
                    <div className="border-t border-slate-100 bg-slate-50 py-12 sm:py-16">
                        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                            <div className="mb-8">
                                <span className="mb-2 block text-[10px] font-black tracking-widest text-primary uppercase">
                                    Standard Sizes
                                </span>
                                <h2 className="text-2xl font-bold text-secondary sm:text-3xl">
                                    Available in{' '}
                                    {product.product_variants.length} standard
                                    size
                                    {product.product_variants.length !== 1
                                        ? 's'
                                        : ''}
                                </h2>
                                <p className="mt-2 text-[13px] text-slate-500">
                                    Need a custom size?{' '}
                                    <Link
                                        href="/get-quote"
                                        className="font-bold text-primary hover:underline"
                                    >
                                        Request a custom quote →
                                    </Link>
                                </p>
                            </div>

                            <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
                                {/* Table header */}
                                <div className="hidden grid-cols-[auto_1fr_auto] gap-4 border-b border-slate-100 bg-slate-50/60 px-6 py-3 sm:grid">
                                    <span className="w-20 text-[10px] font-black tracking-widest text-slate-400 uppercase">
                                        Preview
                                    </span>
                                    <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
                                        Specification
                                    </span>
                                    <span className="text-right text-[10px] font-black tracking-widest text-slate-400 uppercase">
                                        Price & Action
                                    </span>
                                </div>

                                <div className="divide-y divide-slate-50 px-4 sm:px-6">
                                    {product.product_variants.map((variant) => (
                                        <VariantRow
                                            key={variant.id}
                                            variant={variant}
                                            productName={product.name}
                                            productId={product.id}
                                        />
                                    ))}
                                </div>

                                {/* Custom size CTA row */}
                                <div className="flex flex-col items-start justify-between gap-3 border-t border-slate-100 bg-slate-50 px-4 py-4 sm:flex-row sm:items-center sm:px-6">
                                    <div>
                                        <p className="text-[13px] font-bold text-slate-700">
                                            Need a different size?
                                        </p>
                                        <p className="text-[11px] text-slate-400">
                                            We fabricate fully custom
                                            dimensions. Our technician will
                                            measure on-site.
                                        </p>
                                    </div>
                                    <Link
                                        href="/get-quote"
                                        className="flex-shrink-0 rounded-xl border-2 border-slate-200 px-5 py-2.5 text-[12px] font-bold whitespace-nowrap text-slate-600 no-underline transition-all hover:border-primary hover:text-primary"
                                    >
                                        Custom Size Quote →
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* ── RELATED PRODUCTS ── */}
                {related.length > 0 && (
                    <div className="border-t border-slate-100 py-12 sm:py-16">
                        <div className="mx-auto max-w-7xl items-center gap-10 px-4 py-6 sm:px-6 sm:py-8 md:px-6 lg:px-8">
                            <div className="mb-8 flex items-end justify-between">
                                <div>
                                    <span className="mb-2 block text-[10px] font-black tracking-widest text-primary uppercase">
                                        You May Also Like
                                    </span>
                                    <h2 className="text-2xl font-bold text-secondary">
                                        Related Products
                                    </h2>
                                </div>
                                <Link
                                    href="/products"
                                    className="text-[12px] font-bold text-primary hover:underline"
                                >
                                    View All →
                                </Link>
                            </div>

                            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                                {related.map((rp, i) => {
                                    const cover =
                                        rp.product_images?.[0]?.url ?? null;
                                    return (
                                        <Link
                                            key={rp.id}
                                            href={`/products/${rp.id}`}
                                            className="group block overflow-hidden rounded-2xl border border-slate-100 bg-white no-underline shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                                        >
                                            <div
                                                className="flex h-40 items-center justify-center overflow-hidden"
                                                style={{
                                                    background: cover
                                                        ? '#f8fafc'
                                                        : GRADIENTS[
                                                              i %
                                                                  GRADIENTS.length
                                                          ],
                                                }}
                                            >
                                                {cover ? (
                                                    <img
                                                        src={cover}
                                                        alt={rp.name}
                                                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                                                    />
                                                ) : (
                                                    <span className="text-[28px] font-black text-white opacity-20">
                                                        {rp.name
                                                            .slice(0, 2)
                                                            .toUpperCase()}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="p-4">
                                                <h3 className="mb-1 font-bold text-slate-900">
                                                    {rp.name}
                                                </h3>
                                                <p className="mb-2 line-clamp-1 text-[11px] text-slate-400">
                                                    {rp.description}
                                                </p>
                                                <p
                                                    className="text-[12px] font-bold"
                                                    style={{ color: '#608DB9' }}
                                                >
                                                    from ₱
                                                    {fmt(rp.price_per_unit)}
                                                    <span className="font-normal text-slate-400">
                                                        /{rp.unit}
                                                    </span>
                                                </p>
                                            </div>
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}

                <Footer />
            </div>
        </>
    );
}
