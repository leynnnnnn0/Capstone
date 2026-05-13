import { useState } from 'react';
import { Head } from '@inertiajs/react';
import type { CartItem, GetQuotePageProps } from '@/types';
import { nextId } from '@/lib/quoteUtils'
import ProductConfigurator from './ProductConfigurator';
import { CartSidebar } from './CartSidebar';
import { CheckoutForm } from './CheckoutForm';
import Navbar from './Navbar';
import Footer from './Footer';

export default function GetQuote({
    products,
    preSelectedProduct,
    preSelectedProductVariant,
}: GetQuotePageProps) {
    const [cart, setCart] = useState<CartItem[]>([]);
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [showCheckout, setShowCheckout] = useState(false);

    const handleAdd = (item: CartItem) => {
        setCart((prev) => [...prev, { ...item, _id: nextId() }]);
    };

    const handleUpdate = (updated: CartItem) => {
        setCart((prev) =>
            prev.map((item, i) =>
                i === editingIndex ? { ...updated, _id: item._id } : item,
            ),
        );
        setEditingIndex(null);
    };

    const handleRemove = (index: number) => {
        setCart((prev) => prev.filter((_, i) => i !== index));
        if (editingIndex === index) setEditingIndex(null);
    };

    const handleCancelEdit = () => setEditingIndex(null);
    const editingItem = editingIndex !== null ? cart[editingIndex] : null;

    return (
        <>
            <Head title="Get a Quote — SOG Glass & Aluminum" />

            <div className="min-h-screen" style={{ background: '#f8fafc' }}>
                <Navbar />

                {/* ── HERO ── */}
                <div className="bg-primary">
                    <div className="mx-auto max-w-7xl items-center gap-10 px-4 py-6 sm:px-6 sm:py-8 md:px-6 lg:px-8">
                        <div
                            className="mb-4 inline-flex items-center gap-2 rounded-lg px-3 py-1"
                            style={{ background: 'rgba(255,255,255,0.1)' }}
                        >
                            <span
                                className="text-[10px] font-bold tracking-widest uppercase"
                                style={{ color: 'rgba(255,255,255,0.7)' }}
                            >
                                Free Inspection Included
                            </span>
                        </div>
                        <h1
                            className="mb-2 text-[20px] leading-tight font-extrabold sm:text-[30px]"
                            style={{ color: 'white' }}
                        >
                            Build your quote,
                            <br />
                            <span className="text-white">
                                one product at a time.
                            </span>
                        </h1>
                        <p
                            className="max-w-md text-[13px] sm:text-[14px]"
                            style={{ color: 'rgba(255,255,255,0.6)' }}
                        >
                            Add as many products as you need — windows, doors,
                            cabinets — all in a single request.
                        </p>
                    </div>
                </div>

                {/* ── BODY ── */}
                <div className="mx-auto max-w-7xl px-4 py-8 pb-24 sm:px-6 lg:px-8 lg:pb-16">
                    {showCheckout ? (
                        <CheckoutForm
                            cart={cart}
                            onBack={() => setShowCheckout(false)}
                            onSuccess={() => {
                                setCart([]);
                                setShowCheckout(false);
                                setEditingIndex(null);
                            }}
                        />
                    ) : (
                        /* On mobile: stacked. On lg+: side-by-side with sticky cart */
                        <div className="flex flex-col items-start gap-6 lg:flex-row lg:gap-7">
                            <ProductConfigurator
                                products={products}
                                preSelectedProduct={preSelectedProduct}
                                preSelectedProductVariant={
                                    preSelectedProductVariant
                                }
                                editingItem={editingItem}
                                onAdd={handleAdd}
                                onUpdate={handleUpdate}
                                onCancelEdit={handleCancelEdit}
                            />
                            <CartSidebar
                                cart={cart}
                                onRemove={handleRemove}
                                onEdit={setEditingIndex}
                                onCheckout={() => setShowCheckout(true)}
                            />
                        </div>
                    )}
                </div>

                <Footer />
            </div>
        </>
    );
}
