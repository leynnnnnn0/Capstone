import { useForm } from '@inertiajs/react';
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import type { CartItem, QuoteFormPayload } from '@/types';
import {
    cartItemToPayload,
    computeItemTotal,
    fmt,
    variantLabel,
} from '@/lib/quoteUtils';
import LocationPicker from './LocationPicker';

interface Props {
    cart: CartItem[];
    onBack: () => void;
    onSuccess: () => void;
}

type ClientErrors = Partial<Record<string, string>>;

export function CheckoutForm({ cart, onBack, onSuccess }: Props) {
    const grandTotal = cart.reduce((s, item) => s + computeItemTotal(item), 0);

    const { data, setData, post, processing, errors, reset } =
        useForm<QuoteFormPayload>({
            first_name: '',
            last_name: '',
            phone_number: '',
            email: '',
            address: '',
            address_pinned: '',
            address_lat: '',
            address_lng: '',
            preferred_date: '',
            preferred_time: 'Morning (8–12 AM)',
            additional_notes: '',
            consent: false,
            items: cart.map(cartItemToPayload),
        });

    const [clientErrors, setClientErrors] = useState<ClientErrors>({});
    const [submitted, setSubmitted] = useState(false);

    const clearError = (field: string) => {
        if (clientErrors[field]) {
            setClientErrors((prev) => {
                const n = { ...prev };
                delete n[field];
                return n;
            });
        }
    };

    const fieldError = (field: string) =>
        errors[field as keyof typeof errors] || clientErrors[field];

    const validate = (): boolean => {
        const e: ClientErrors = {};
        const nameRx = /^[A-Za-zÀ-ÖØ-öø-ÿ' -]{2,50}$/;
        const emailRx = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[A-Za-z]{2,}$/;

        if (!data.first_name.trim()) e.first_name = 'First name is required.';
        else if (!nameRx.test(data.first_name.trim()))
            e.first_name = 'First name must be 2–50 letters.';
        if (!data.last_name.trim()) e.last_name = 'Last name is required.';
        else if (!nameRx.test(data.last_name.trim()))
            e.last_name = 'Last name must be 2–50 letters.';
        if (!data.phone_number.trim())
            e.phone_number = 'Phone number is required.';
        else if (!/^[0-9+\s\-]{10,15}$/.test(data.phone_number.trim()))
            e.phone_number = 'Enter a valid phone number (10–15 digits).';
        if (!data.email.trim()) e.email = 'Email is required.';
        else if (!emailRx.test(data.email.trim()))
            e.email = 'Enter a valid email address.';
        if (!data.preferred_date)
            e.preferred_date = 'Preferred date is required.';
        else if (
            new Date(data.preferred_date) < new Date(new Date().toDateString())
        )
            e.preferred_date = 'Date cannot be in the past.';
        if (!data.consent) e.consent = 'You must agree to be contacted.';

        setClientErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;
        setData('items', cart.map(cartItemToPayload));

        post('/get-quote', {
            preserveScroll: true,
            onSuccess: () => {
                reset();
                setSubmitted(true);
                onSuccess();
            },
        });
    };

    // ── Success screen ────────────────────────────────────────────────────────
    if (submitted) {
        return (
            <div className="mx-auto max-w-lg px-4 py-12 text-center sm:py-16">
                <div
                    className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full text-[32px]"
                    style={{ background: '#eef2f8' }}
                >
                    ✓
                </div>
                <h2 className="mb-3 text-[26px] font-bold text-slate-900 sm:text-[30px]">
                    Quote Submitted!
                </h2>
                <p className="mb-6 text-[14px] leading-relaxed text-slate-500 sm:text-[15px]">
                    We received your request for{' '}
                    <strong>
                        {cart.length} item{cart.length !== 1 ? 's' : ''}
                    </strong>
                    . Our team will reach out within 24 hours to confirm your
                    free on-site inspection.
                </p>
                <div
                    className="mb-8 inline-block rounded-2xl px-8 py-4"
                    style={{ background: '#f8fafc' }}
                >
                    <p className="mb-1 text-[11px] text-slate-400">
                        Total Estimated Quote
                    </p>
                    <p
                        className="text-[28px] font-extrabold"
                        style={{ color: '#2c5282' }}
                    >
                        ₱{fmt(Math.round(grandTotal))}
                    </p>
                </div>
            </div>
        );
    }

    // ── Form ─────────────────────────────────────────────────────────────────
    return (
        <div className="mx-auto max-w-4xl">
            {/* Back */}
            <div className="mb-6">
                <button
                    type="button"
                    onClick={onBack}
                    className="mb-4 cursor-pointer rounded-lg border-none bg-slate-100 px-3 py-1.5 text-[12px] font-bold text-slate-500 transition-colors hover:bg-slate-200"
                >
                    ← Back to Quote
                </button>
                <h2 className="mb-1.5 text-[24px] font-bold text-slate-900 sm:text-[28px]">
                    Almost there!
                </h2>
                <p className="text-[13px] text-slate-500 sm:text-[14px]">
                    Fill in your details so we can schedule your free
                    inspection.
                </p>
            </div>

            {errors.rate_limit && (
                <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[12px] font-medium text-red-600">
                    {errors.rate_limit}
                </div>
            )}

            <form onSubmit={handleSubmit}>
                {/* Stacks on mobile, 2-col on md+ */}
                <div className="grid grid-cols-1 gap-5 sm:gap-6 md:grid-cols-2">
                    {/* ── LEFT: Contact form ── */}
                    <div
                        className="rounded-2xl p-5 sm:p-6"
                        style={{
                            background: 'white',
                            border: '1.5px solid #e2e8f0',
                        }}
                    >
                        <p className="mb-5 text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                            Your Contact Info
                        </p>

                        {/* Name row */}
                        <div className="mb-4 grid grid-cols-2 gap-3">
                            <div>
                                <Label className="mb-1.5 block text-[11px] font-bold tracking-wide text-slate-500 uppercase">
                                    First Name *
                                </Label>
                                <Input
                                    placeholder="Juan"
                                    value={data.first_name}
                                    onChange={(e) => {
                                        setData('first_name', e.target.value);
                                        clearError('first_name');
                                    }}
                                />
                                {fieldError('first_name') && (
                                    <p className="mt-1 text-[11px] text-red-500">
                                        {fieldError('first_name')}
                                    </p>
                                )}
                            </div>
                            <div>
                                <Label className="mb-1.5 block text-[11px] font-bold tracking-wide text-slate-500 uppercase">
                                    Last Name *
                                </Label>
                                <Input
                                    placeholder="Dela Cruz"
                                    value={data.last_name}
                                    onChange={(e) => {
                                        setData('last_name', e.target.value);
                                        clearError('last_name');
                                    }}
                                />
                                {fieldError('last_name') && (
                                    <p className="mt-1 text-[11px] text-red-500">
                                        {fieldError('last_name')}
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="mb-4">
                            <Label className="mb-1.5 block text-[11px] font-bold tracking-wide text-slate-500 uppercase">
                                Phone / Viber *
                            </Label>
                            <Input
                                type="tel"
                                placeholder="+63 9XX XXX XXXX"
                                value={data.phone_number}
                                onChange={(e) => {
                                    setData('phone_number', e.target.value);
                                    clearError('phone_number');
                                }}
                            />
                            {fieldError('phone_number') && (
                                <p className="mt-1 text-[11px] text-red-500">
                                    {fieldError('phone_number')}
                                </p>
                            )}
                        </div>

                        <div className="mb-4">
                            <Label className="mb-1.5 block text-[11px] font-bold tracking-wide text-slate-500 uppercase">
                                Email *
                            </Label>
                            <Input
                                type="email"
                                placeholder="juan@example.com"
                                value={data.email}
                                onChange={(e) => {
                                    setData('email', e.target.value);
                                    clearError('email');
                                }}
                            />
                            {fieldError('email') && (
                                <p className="mt-1 text-[11px] text-red-500">
                                    {fieldError('email')}
                                </p>
                            )}
                        </div>

                        <div className="mb-4 grid grid-cols-2 gap-3">
                            <div>
                                <Label className="mb-1.5 block text-[11px] font-bold tracking-wide text-slate-500 uppercase">
                                    Preferred Date *
                                </Label>
                                <Input
                                    type="date"
                                    value={data.preferred_date}
                                    onChange={(e) => {
                                        setData(
                                            'preferred_date',
                                            e.target.value,
                                        );
                                        clearError('preferred_date');
                                    }}
                                />
                                {fieldError('preferred_date') && (
                                    <p className="mt-1 text-[11px] text-red-500">
                                        {fieldError('preferred_date')}
                                    </p>
                                )}
                            </div>
                            <div>
                                <Label className="mb-1.5 block text-[11px] font-bold tracking-wide text-slate-500 uppercase">
                                    Preferred Time *
                                </Label>
                                <Select
                                    value={data.preferred_time}
                                    onValueChange={(v) =>
                                        setData('preferred_time', v)
                                    }
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Select time" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Morning (8–12 AM)">
                                            Morning (8–12 AM)
                                        </SelectItem>
                                        <SelectItem value="Afternoon (1–5 PM)">
                                            Afternoon (1–5 PM)
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                          <div>
                                <Label className="mb-1.5 block text-[11px] font-bold tracking-wide text-slate-500 uppercase">
                                Address *
                                
                            </Label>

                                  <LocationPicker
                                                                onLocationChange={({
                                                                    address,
                                                                    pinned,
                                                                    lat,
                                                                    lng,
                                                                }) => {
                                                                    setData((prev) => ({
                                                                        ...prev,
                                                                        address: address,
                                                                        address_pinned: pinned,
                                                                        address_lat: lat.toFixed(6),
                                                                        address_lng: lng.toFixed(6),
                                                                    }));
                                                                }}
                                                                error={fieldError('address')}
                                                            />
                            
                            </div>

                        <div className="mb-5">
                            <Label className="mb-1.5 block text-[11px] font-bold tracking-wide text-slate-500 uppercase">
                                Additional Notes
                            </Label>
                            <Textarea
                                rows={3}
                                placeholder="Access instructions, special requests…"
                                value={data.additional_notes}
                                onChange={(e) =>
                                    setData('additional_notes', e.target.value)
                                }
                                className="resize-none"
                            />
                        </div>

                        <div className="mb-2 flex items-start gap-3">
                            <Checkbox
                                id="consent"
                                checked={data.consent}
                                onCheckedChange={(checked) => {
                                    setData('consent', checked as boolean);
                                    clearError('consent');
                                }}
                            />
                            <label
                                htmlFor="consent"
                                className="cursor-pointer text-[12px] leading-relaxed text-slate-500"
                            >
                                I agree to be contacted via call, SMS, or email
                                by SOG Glass &amp; Aluminum regarding my
                                appointment request and related services.
                            </label>
                        </div>
                        {fieldError('consent') && (
                            <p className="mb-2 text-[11px] text-red-500">
                                {fieldError('consent')}
                            </p>
                        )}
                    </div>

                    {/* ── RIGHT: Summary + Submit ── */}
                    <div className="flex flex-col gap-4">
                        {/* Order summary */}
                        <div
                            className="rounded-2xl p-5 sm:p-6"
                            style={{
                                background: 'white',
                                border: '1.5px solid #e2e8f0',
                            }}
                        >
                            <p className="mb-4 text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                                Order Summary
                            </p>
                            {cart.map((item, i) => (
                                <div
                                    key={item._id}
                                    className="flex items-start justify-between py-3"
                                    style={{
                                        borderBottom:
                                            i < cart.length - 1
                                                ? '1px solid #f8fafc'
                                                : 'none',
                                    }}
                                >
                                    <div className="min-w-0 flex-1 pr-3">
                                        <p className="mb-0.5 text-[13px] font-bold text-slate-900">
                                            {item.product.name}
                                        </p>
                                        {item.size_mode === 'standard' &&
                                        item.variant ? (
                                            <p
                                                className="mb-1 text-[11px] font-semibold"
                                                style={{ color: '#2c5282' }}
                                            >
                                                📐 {variantLabel(item.variant)}
                                            </p>
                                        ) : item.width ? (
                                            <p className="mb-1 text-[11px] text-slate-400">
                                                {item.product.unit === 'sqm'
                                                    ? `${item.width}m × ${item.height}m`
                                                    : `${item.width}m`}
                                                {item.thickness
                                                    ? ` · ${item.thickness}mm`
                                                    : ''}
                                            </p>
                                        ) : null}
                                        {item.selected_options.length > 0 && (
                                            <div className="mb-0.5 flex flex-wrap gap-1">
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
                                    <p
                                        className="flex-shrink-0 text-[13px] font-extrabold"
                                        style={{ color: '#2c5282' }}
                                    >
                                        ₱
                                        {fmt(
                                            Math.round(computeItemTotal(item)),
                                        )}
                                    </p>
                                </div>
                            ))}
                            <div
                                className="mt-1 flex items-baseline justify-between pt-4"
                                style={{ borderTop: '2px solid #f1f5f9' }}
                            >
                                <span className="text-[14px] font-bold text-slate-900">
                                    Estimated Total
                                </span>
                                <span
                                    className="text-[22px] font-extrabold"
                                    style={{ color: '#2c5282' }}
                                >
                                    ₱{fmt(Math.round(grandTotal))}
                                </span>
                            </div>
                        </div>

                        {/* What happens next */}
                        <div
                            className="rounded-2xl p-5"
                            style={{
                                background: '#f8fafc',
                                border: '1.5px solid #e2e8f0',
                            }}
                        >
                            <p className="mb-4 text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                                What happens next
                            </p>
                            {[
                                {
                                    icon: '📞',
                                    t: 'We call you',
                                    d: 'Within 24 hrs to confirm your schedule',
                                },
                                {
                                    icon: '🏠',
                                    t: 'Free inspection',
                                    d: 'Technician visits and measures on-site',
                                },
                                {
                                    icon: '📋',
                                    t: 'Final quote',
                                    d: 'Itemized breakdown, zero surprises',
                                },
                                {
                                    icon: '🔨',
                                    t: 'We build it',
                                    d: 'Fabrication starts after your approval',
                                },
                            ].map((x, i) => (
                                <div
                                    key={i}
                                    className={`flex gap-3 ${i < 3 ? 'mb-3' : ''}`}
                                >
                                    <span className="flex-shrink-0 text-[14px]">
                                        {x.icon}
                                    </span>
                                    <div>
                                        <p className="text-[12px] font-bold text-slate-900">
                                            {x.t}
                                        </p>
                                        <p className="text-[11px] text-slate-500">
                                            {x.d}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <button
                            type="submit"
                            disabled={processing || !data.consent}
                            className="w-full rounded-xl py-4 text-[14px] font-bold text-white transition-opacity"
                            style={{
                                background: '#2c5282',
                                border: 'none',
                                cursor:
                                    processing || !data.consent
                                        ? 'not-allowed'
                                        : 'pointer',
                                opacity: processing || !data.consent ? 0.6 : 1,
                            }}
                        >
                            {processing
                                ? 'Submitting…'
                                : 'Submit Quote Request ✓'}
                        </button>
                        <p className="-mt-1 text-center text-[10px] leading-relaxed text-slate-400">
                            By submitting you agree to a free no-obligation
                            inspection visit.
                        </p>
                    </div>
                </div>
            </form>
        </div>
    );
}
