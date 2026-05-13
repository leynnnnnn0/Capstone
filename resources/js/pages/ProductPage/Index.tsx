import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import Navbar from '../Navbar';
import Footer from '../Footer';

// ─── Types ───────────────────────────────────────────────────────────────────

interface ProductImage {
    id: number;
    url: string;
}
interface Category {
    id: number;
    name: string;
}

interface CatalogProduct {
    id: number;
    name: string;
    description: string;
    unit: string;
    price_per_unit: number;
    product_images: ProductImage[];
    categories: Category[];
}

interface Props {
    products: CatalogProduct[];
    categories: Category[];
    active_category_id: number | null;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const GRADIENTS = [
    'linear-gradient(135deg,#1a2332,#2c5282)',
    'linear-gradient(135deg,#2c5282,#6a8fa8)',
    'linear-gradient(135deg,#4a7291,#9eb4c9)',
    'linear-gradient(135deg,#1a2332,#4a7291)',
    'linear-gradient(135deg,#162d4a,#2c5282)',
    'linear-gradient(135deg,#6a8fa8,#c8dae8)',
];

function fmt(n: number) {
    return Number(n).toLocaleString('en-PH', { minimumFractionDigits: 0 });
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function ProductsIndex({
    products,
    categories,
    active_category_id,
}: Props) {
    const [search, setSearch] = useState('');

    const filtered = search.trim()
        ? products.filter(
              (p) =>
                  p.name.toLowerCase().includes(search.toLowerCase()) ||
                  p.description.toLowerCase().includes(search.toLowerCase()),
          )
        : products;

    const setCategory = (id: number | null) => {
        router.get('/products', id ? { category: id } : {}, {
            preserveScroll: false,
        });
    };

    return (
        <>
            <Head title="Products — SOG Glass & Aluminum" />

            <div className="min-h-screen bg-white text-slate-900">
                <Navbar />

                {/* ── HERO BAND ── */}
                <div className="bg-primary">
                    <div className="mx-auto max-w-7xl items-center gap-10 px-4 py-6 sm:px-6 sm:py-8 md:px-6 lg:px-8">
                        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
                            <div>
                                <div
                                    className="mb-4 inline-flex items-center gap-2 rounded-lg px-3 py-1"
                                    style={{
                                        background: 'rgba(255,255,255,0.1)',
                                    }}
                                >
                                    <span
                                        className="text-[10px] font-bold tracking-widest uppercase"
                                        style={{
                                            color: 'rgba(255,255,255,0.7)',
                                        }}
                                    >
                                        Catalog
                                    </span>
                                </div>
                                <h1
                                    className="mb-2 text-[20px] leading-tight font-extrabold sm:text-[30px]"
                                    style={{ color: 'white' }}
                                >
                                    Everything we craft,
                                    <br className="hidden sm:block" /> built for
                                    your space.
                                </h1>
                            </div>
                            {/* Search */}
                            <div className="relative w-full sm:w-72">
                                <input
                                    type="text"
                                    placeholder="Search products…"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 pr-9 text-[13px] text-slate-700 placeholder-slate-400 transition focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none"
                                />
                                <svg
                                    className="absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-slate-400"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                                    />
                                </svg>
                            </div>
                        </div>

                        {/* Category filter chips */}
                        {categories.length > 0 && (
                            <div className="mt-6 flex flex-wrap gap-2">
                                <button
                                    onClick={() => setCategory(null)}
                                    className="cursor-pointer rounded-full px-4 py-1.5 text-[12px] font-bold transition-all"
                                    style={{
                                        background: !active_category_id
                                            ? '#9eb4c9'
                                            : 'white',
                                        color: !active_category_id
                                            ? 'white'
                                            : '#64748b',
                                        border: !active_category_id
                                            ? '2px solid #9eb4c9'
                                            : '1.5px solid #e2e8f0',
                                    }}
                                >
                                    All
                                </button>
                                {categories.map((cat) => (
                                    <button
                                        key={cat.id}
                                        onClick={() => setCategory(cat.id)}
                                        className="cursor-pointer rounded-full px-4 py-1.5 text-[12px] font-bold transition-all"
                                        style={{
                                            background:
                                                active_category_id === cat.id
                                                    ? '#9eb4c9'
                                                    : 'white',
                                            color:
                                                active_category_id === cat.id
                                                    ? 'white'
                                                    : '#64748b',
                                            border:
                                                active_category_id === cat.id
                                                    ? '2px solid #9eb4c9'
                                                    : '1.5px solid #e2e8f0',
                                        }}
                                    >
                                        {cat.name}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* ── GRID ── */}
                <div className="mx-auto max-w-7xl px-4 py-12 pb-24 md:px-6 lg:px-8">
                    {filtered.length === 0 ? (
                        <div className="py-24 text-center text-slate-400">
                            <p className="mb-4 text-5xl">🪟</p>
                            <p className="mb-2 text-lg font-semibold">
                                No products found
                            </p>
                            <p className="text-sm">
                                Try a different search or category
                            </p>
                        </div>
                    ) : (
                        <>
                            <p className="mb-6 text-[12px] font-medium text-slate-400">
                                {filtered.length} product
                                {filtered.length !== 1 ? 's' : ''}
                                {search && ` for "${search}"`}
                            </p>

                            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                {filtered.map((product, i) => {
                                    const cover =
                                        product.product_images?.[0]?.url ??
                                        null;
                                    const gradient =
                                        GRADIENTS[i % GRADIENTS.length];

                                    return (
                                        <Link
                                            key={product.id}
                                            href={`/products/${product.id}`}
                                            className="group block overflow-hidden rounded-2xl border border-slate-100 bg-white no-underline shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                                        >
                                            {/* Image */}
                                            <div
                                                className="flex h-48 items-center justify-center overflow-hidden"
                                                style={{
                                                    background: cover
                                                        ? '#f8fafc'
                                                        : gradient,
                                                }}
                                            >
                                                {cover ? (
                                                    <img
                                                        src={cover}
                                                        alt={product.name}
                                                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                                                    />
                                                ) : (
                                                    <div className="flex h-full items-center justify-center">
                                                        <span className="text-[32px] font-black text-white opacity-30">
                                                            {product.name
                                                                .slice(0, 2)
                                                                .toUpperCase()}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="p-4">
                                                {product.categories?.[0] && (
                                                    <span className="mb-2 inline-block rounded bg-blue-50 px-2 py-0.5 text-[9px] font-bold tracking-widest text-primary uppercase">
                                                        {
                                                            product
                                                                .categories[0]
                                                                .name
                                                        }
                                                    </span>
                                                )}
                                                <h3 className="mb-1 leading-snug font-bold text-slate-900">
                                                    {product.name}
                                                </h3>
                                                <p className="mb-3 line-clamp-2 text-[11px] leading-relaxed text-slate-400">
                                                    {product.description}
                                                </p>
                                                <div className="flex items-center justify-between">
                                                    <span className="text-[12px] font-bold text-primary">
                                                        from ₱
                                                        {fmt(
                                                            product.price_per_unit,
                                                        )}
                                                        <span className="font-normal text-slate-400">
                                                            /{product.unit}
                                                        </span>
                                                    </span>
                                                    <span className="text-[11px] font-bold text-slate-400 transition-colors group-hover:text-primary">
                                                        View →
                                                    </span>
                                                </div>
                                            </div>
                                        </Link>
                                    );
                                })}
                            </div>
                        </>
                    )}
                </div>

                <Footer />
            </div>
        </>
    );
}
