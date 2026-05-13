import { Head, Link } from '@inertiajs/react';
import Navbar from './Navbar';
import Footer from './Footer';

// ─── Types ────────────────────────────────────────────────────────────────────

interface SummaryItem {
    name: string;
    size: string | null; // e.g. "1200 × 2100 mm" or "1.2m × 2.1m"
    options: string[]; // e.g. ["Tempered", "Powder Black"]
    pieces: number;
    total_amount: number;
}

export interface QuoteSuccessProps {
    appointment_number: string;
    first_name: string;
    preferred_date: string; // "2026-05-10"
    preferred_time: string; // "Morning (8–12 AM)"
    phone_number: string;
    email: string;
    items: SummaryItem[];
    grand_total: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmt(n: number) {
    return Number(n).toLocaleString('en-PH', { minimumFractionDigits: 0 });
}

function formatDate(d: string) {
    return new Date(d + 'T00:00:00').toLocaleDateString('en-PH', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
}

// ─── Steps data ──────────────────────────────────────────────────────────────

const NEXT_STEPS = [
    {
        num: '01',
        icon: '📞',
        title: 'We call you',
        body: 'A SOG representative will call or message you within 24 hours to confirm the inspection schedule.',
        done: true,
    },
    {
        num: '02',
        icon: '🏠',
        title: 'Free on-site inspection',
        body: 'Our certified technician visits your space, takes precise measurements, and reviews your product choices in person.',
        done: false,
    },
    {
        num: '03',
        icon: '📋',
        title: 'Finalized quote',
        body: 'You receive a detailed itemized quotation — materials, labor, and timeline — all clearly broken down with zero hidden charges.',
        done: false,
    },
    {
        num: '04',
        icon: '✅',
        title: 'Approve & schedule',
        body: 'Once you approve the final quote, we schedule fabrication and installation at a time that works for you.',
        done: false,
    },
    {
        num: '05',
        icon: '🔨',
        title: 'Fabrication & installation',
        body: 'Our team fabricates your order in-house and installs it with precision. Most orders are completed within 7–14 business days.',
        done: false,
    },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function QuoteSuccess({
    appointment_number,
    first_name,
    preferred_date,
    preferred_time,
    phone_number,
    email,
    items,
    grand_total,
}: QuoteSuccessProps) {
    return (
        <>
            <Head title="Quote Submitted — SOG Glass & Aluminum" />

            <div
                className="min-h-screen"
                style={{
                    background: '#f8fafc',
                    fontFamily: "'DM Sans', system-ui, sans-serif",
                }}
            >
                <Navbar />

                {/* ── HERO BAND ── */}
                <div
                    className="relative overflow-hidden px-5 pt-14 pb-28 sm:px-10 sm:pt-16 sm:pb-32 lg:px-16"
                    style={{
                        background:
                            'linear-gradient(135deg,#1a2332 0%,#2c5282 60%,#3d6fa0 100%)',
                    }}
                >
                    {/* Decorative rings */}
                    <div
                        className="pointer-events-none absolute -top-20 -right-20 h-72 w-72 rounded-full opacity-10"
                        style={{ border: '40px solid white' }}
                    />
                    <div
                        className="pointer-events-none absolute top-10 -right-4 h-40 w-40 rounded-full opacity-5"
                        style={{ border: '24px solid white' }}
                    />

                    <div className="relative mx-auto max-w-3xl text-center">
                        {/* Check icon */}
                        <div className="mb-6 flex justify-center">
                            <div
                                className="flex h-20 w-20 items-center justify-center rounded-full text-[36px] sm:h-24 sm:w-24 sm:text-[40px]"
                                style={{
                                    background: 'rgba(255,255,255,0.15)',
                                    border: '2px solid rgba(255,255,255,0.3)',
                                }}
                            >
                                ✓
                            </div>
                        </div>

                        <div
                            className="mb-5 inline-flex items-center gap-2 rounded-full px-4 py-1.5"
                            style={{
                                background: 'rgba(255,255,255,0.12)',
                                border: '1px solid rgba(255,255,255,0.2)',
                            }}
                        >
                            <span className="text-[10px] font-bold tracking-widest text-white uppercase opacity-80 sm:text-[11px]">
                                Quote Request Received
                            </span>
                        </div>

                        <h1 className="mb-4 text-[30px] leading-tight font-extrabold text-white sm:text-[42px]">
                            You're all set,{' '}
                            <span style={{ color: '#608DB9' }}>
                                {first_name}!
                            </span>
                        </h1>
                        <p
                            className="mx-auto max-w-md text-[14px] leading-relaxed sm:text-[16px]"
                            style={{ color: 'rgba(255,255,255,0.65)' }}
                        >
                            Your quote request has been submitted. We'll be in
                            touch within 24 hours to confirm your free on-site
                            inspection.
                        </p>
                    </div>
                </div>

                {/* ── REFERENCE CARD (overlaps hero) ── */}
                <div className="relative z-10 mx-auto -mt-16 mb-8 max-w-3xl px-4 sm:-mt-20 sm:px-6">
                    <div
                        className="overflow-hidden rounded-2xl sm:rounded-3xl"
                        style={{
                            background: 'white',
                            border: '1.5px solid #e2e8f0',
                            boxShadow: '0 20px 60px rgba(44,82,130,0.15)',
                        }}
                    >
                        {/* Card header */}
                        <div
                            className="flex flex-col gap-3 px-6 py-5 sm:flex-row sm:items-center sm:justify-between"
                            style={{
                                background:
                                    'linear-gradient(135deg,#1a2332,#2c5282)',
                            }}
                        >
                            <div>
                                <p
                                    className="mb-1 text-[10px] font-bold tracking-widest uppercase"
                                    style={{ color: 'rgba(255,255,255,0.5)' }}
                                >
                                    Appointment Reference
                                </p>
                                <p className="text-[22px] font-extrabold tracking-wide text-white sm:text-[26px]">
                                    {appointment_number}
                                </p>
                            </div>
                            <div
                                className="inline-flex items-center gap-2 self-start rounded-xl px-4 py-2 sm:self-auto"
                                style={{
                                    background: 'rgba(255,255,255,0.12)',
                                    border: '1px solid rgba(255,255,255,0.2)',
                                }}
                            >
                                <span className="h-2 w-2 flex-shrink-0 animate-pulse rounded-full bg-green-400" />
                                <span className="text-[11px] font-bold text-white">
                                    Pending Confirmation
                                </span>
                            </div>
                        </div>

                        {/* Appointment details grid */}
                        <div
                            className="grid grid-cols-2 gap-4 px-6 py-5 sm:grid-cols-4"
                            style={{ borderBottom: '1px solid #f1f5f9' }}
                        >
                            {[
                                {
                                    label: 'Inspection Date',
                                    value: formatDate(preferred_date),
                                },
                                {
                                    label: 'Preferred Time',
                                    value: preferred_time,
                                },
                                {
                                    label: 'Contact Number',
                                    value: phone_number,
                                },
                                { label: 'Email', value: email },
                            ].map((d) => (
                                <div key={d.label}>
                                    <p className="mb-1 text-[10px] font-bold tracking-wide text-slate-400 uppercase">
                                        {d.label}
                                    </p>
                                    <p className="text-[13px] leading-snug font-semibold break-all text-slate-800">
                                        {d.value}
                                    </p>
                                </div>
                            ))}
                        </div>

                        {/* Items */}
                        <div className="px-6 py-4">
                            <p className="mb-3 text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                                Items Requested ({items.length})
                            </p>
                            <div className="space-y-2.5">
                                {items.map((item, i) => (
                                    <div
                                        key={i}
                                        className="flex items-start justify-between gap-3 rounded-xl p-3"
                                        style={{
                                            background: '#f8fafc',
                                            border: '1px solid #f1f5f9',
                                        }}
                                    >
                                        <div className="min-w-0 flex-1">
                                            <p className="mb-0.5 text-[13px] font-bold text-slate-900">
                                                {item.name}
                                            </p>
                                            {item.size && (
                                                <p
                                                    className="mb-1 text-[11px] font-semibold"
                                                    style={{ color: '#2c5282' }}
                                                >
                                                    📐 {item.size}
                                                </p>
                                            )}
                                            {item.options.length > 0 && (
                                                <div className="flex flex-wrap gap-1">
                                                    {item.options.map((o) => (
                                                        <span
                                                            key={o}
                                                            className="rounded px-1.5 py-0.5 text-[9px] font-semibold"
                                                            style={{
                                                                background:
                                                                    '#eef2f8',
                                                                color: '#2c5282',
                                                            }}
                                                        >
                                                            {o}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-shrink-0 text-right">
                                            <p className="mb-0.5 text-[10px] text-slate-400">
                                                {item.pieces} pc
                                                {item.pieces !== 1 ? 's' : ''}
                                            </p>
                                            <p
                                                className="text-[13px] font-extrabold"
                                                style={{ color: '#2c5282' }}
                                            >
                                                ₱
                                                {fmt(
                                                    Math.round(
                                                        item.total_amount,
                                                    ),
                                                )}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Estimated total + disclaimer */}
                        <div
                            className="flex flex-col gap-3 px-6 py-4 sm:flex-row sm:items-center sm:justify-between"
                            style={{
                                background: '#f8fafc',
                                borderTop: '1.5px solid #f1f5f9',
                            }}
                        >
                            <div
                                className="flex flex-1 items-start gap-2.5 rounded-xl p-3"
                                style={{
                                    background: '#fffbeb',
                                    border: '1px solid #fef3c7',
                                }}
                            >
                                <span className="mt-0.5 flex-shrink-0 text-[14px]">
                                    💡
                                </span>
                                <p className="text-[11px] leading-relaxed text-amber-700">
                                    This is an <strong>estimated quote</strong>.
                                    Your final price will be confirmed after our
                                    free on-site inspection — no hidden charges.
                                </p>
                            </div>
                            <div className="flex-shrink-0 text-right sm:pl-6">
                                <p className="mb-0.5 text-[10px] text-slate-400">
                                    Estimated Total
                                </p>
                                <p
                                    className="text-[26px] font-extrabold sm:text-[30px]"
                                    style={{ color: '#2c5282' }}
                                >
                                    ₱{fmt(Math.round(grand_total))}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── NEXT STEPS ── */}
                <div className="mx-auto mb-12 max-w-3xl px-4 sm:px-6">
                    <div className="mb-6 text-center">
                        <p className="mb-2 text-[10px] font-bold tracking-widest text-[#2c5282] uppercase">
                            What Happens Next
                        </p>
                        <h2 className="text-[24px] font-bold text-slate-900 sm:text-[30px]">
                            Here's your roadmap to completion.
                        </h2>
                    </div>

                    <div className="relative">
                        {/* Vertical connector line */}
                        <div
                            className="absolute top-10 bottom-10 left-[27px] hidden w-0.5 sm:left-[31px] sm:block"
                            style={{
                                background:
                                    'linear-gradient(to bottom, #2c5282 8%, #e2e8f0 25%)',
                            }}
                        />

                        <div className="space-y-3 sm:space-y-4">
                            {NEXT_STEPS.map((step, i) => (
                                <div
                                    key={i}
                                    className="flex items-start gap-4 sm:gap-5"
                                >
                                    {/* Step circle */}
                                    <div
                                        className="relative z-10 flex h-14 w-14 flex-shrink-0 flex-col items-center justify-center rounded-2xl text-center"
                                        style={{
                                            background: step.done
                                                ? 'linear-gradient(135deg,#1a2332,#2c5282)'
                                                : 'white',
                                            border: step.done
                                                ? 'none'
                                                : '1.5px solid #e2e8f0',
                                            boxShadow: step.done
                                                ? '0 4px 16px rgba(44,82,130,0.3)'
                                                : '0 2px 8px rgba(0,0,0,0.04)',
                                        }}
                                    >
                                        <span className="mb-0.5 text-[18px] leading-none">
                                            {step.icon}
                                        </span>
                                        <span
                                            className="text-[9px] font-extrabold tracking-wide"
                                            style={{
                                                color: step.done
                                                    ? 'rgba(255,255,255,0.6)'
                                                    : '#94a3b8',
                                            }}
                                        >
                                            {step.num}
                                        </span>
                                    </div>

                                    {/* Content */}
                                    <div
                                        className="flex-1 rounded-2xl p-4 sm:p-5"
                                        style={{
                                            background: step.done
                                                ? 'white'
                                                : 'white',
                                            border: step.done
                                                ? '1.5px solid #2c5282'
                                                : '1.5px solid #f1f5f9',
                                        }}
                                    >
                                        <div className="mb-1.5 flex items-start justify-between gap-2">
                                            <p
                                                className="text-[14px] font-bold"
                                                style={{
                                                    color: step.done
                                                        ? '#2c5282'
                                                        : '#1a202c',
                                                }}
                                            >
                                                {step.title}
                                            </p>
                                            {step.done && (
                                                <span
                                                    className="flex-shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold"
                                                    style={{
                                                        background: '#eef2f8',
                                                        color: '#2c5282',
                                                    }}
                                                >
                                                    You are here
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-[12px] leading-relaxed text-slate-500 sm:text-[13px]">
                                            {step.body}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* ── SAVE REFERENCE CTA ── */}
                <div className="mx-auto mb-12 max-w-3xl px-4 sm:px-6">
                    <div
                        className="flex flex-col items-start gap-5 rounded-2xl p-6 sm:flex-row sm:items-center sm:gap-8 sm:rounded-3xl sm:p-8"
                        style={{
                            background:
                                'linear-gradient(135deg,#1a2332,#2c5282)',
                        }}
                    >
                        <div className="min-w-0 flex-1">
                            <p
                                className="mb-2 text-[10px] font-bold tracking-widest uppercase"
                                style={{ color: 'rgba(255,255,255,0.5)' }}
                            >
                                Save your reference
                            </p>
                            <p className="mb-1 text-[22px] font-extrabold tracking-wide text-white sm:text-[28px]">
                                {appointment_number}
                            </p>
                            <p
                                className="text-[12px] leading-relaxed sm:text-[13px]"
                                style={{ color: 'rgba(255,255,255,0.6)' }}
                            >
                                Screenshot or note down your appointment number.
                                You'll need it if you contact us for updates on
                                your request.
                            </p>
                        </div>
                        <div className="flex w-full flex-shrink-0 flex-col gap-3 sm:w-auto">
                            <button
                                type="button"
                                onClick={() => window.print()}
                                className="w-full cursor-pointer rounded-xl px-6 py-3 text-center text-[13px] font-bold transition-colors sm:w-auto"
                                style={{
                                    background: 'rgba(255,255,255,0.15)',
                                    border: '1.5px solid rgba(255,255,255,0.25)',
                                    color: 'white',
                                }}
                            >
                                🖨️ Print this page
                            </button>
                            <Link
                                href='/get-quote'
                                className="w-full rounded-xl px-6 py-3 text-center text-[13px] font-bold no-underline transition-colors sm:w-auto"
                                style={{
                                    background: 'rgba(255,255,255,0.92)',
                                    color: '#2c5282',
                                    border: 'none',
                                }}
                            >
                                + New Quote
                            </Link>
                        </div>
                    </div>
                </div>

                {/* ── CONTACT BAR ── */}
                <div className="mx-auto mb-16 max-w-3xl px-4 sm:px-6">
                    <div
                        className="flex flex-col items-start gap-4 rounded-2xl p-5 sm:flex-row sm:items-center sm:p-6"
                        style={{
                            background: 'white',
                            border: '1.5px solid #e2e8f0',
                        }}
                    >
                        <div className="flex-1">
                            <p className="mb-1 text-[13px] font-bold text-slate-900">
                                Need to change your schedule?
                            </p>
                            <p className="text-[12px] leading-relaxed text-slate-500">
                                Call or message us directly and mention your
                                appointment number{' '}
                                <strong className="text-slate-700">
                                    {appointment_number}
                                </strong>
                                .
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <a
                                href="tel:+639000000000"
                                className="rounded-xl px-4 py-2.5 text-[12px] font-bold no-underline transition-colors"
                                style={{
                                    background: '#eef2f8',
                                    color: '#2c5282',
                                }}
                            >
                                📞 Call Us
                            </a>
                            <a
                                href="https://m.me/"
                                className="rounded-xl px-4 py-2.5 text-[12px] font-bold no-underline transition-colors"
                                style={{
                                    background: '#eef2f8',
                                    color: '#2c5282',
                                }}
                            >
                                💬 Messenger
                            </a>
                        </div>
                    </div>
                </div>

                <Footer />
            </div>
        </>
    );
}
