import { Head, Link, router, usePage } from '@inertiajs/react';
import { useState, FormEvent } from 'react';
import Navbar from './Navbar';
import Footer from './Footer';

// ─── Types ────────────────────────────────────────────────────────────────────

interface TrackingItem {
    name: string;
    size: string | null;
    options: string[];
    pieces: number;
    total_amount: number;
    status: string | null;
}

interface TrackingRemark {
    action: string;
    message: string;
    by: string;
    created_at: string;
}

interface TrackingResult {
    type: 'appointment' | 'work_job';
    reference_number: string;
    first_name: string;
    full_name: string;
    phone_number: string;
    email: string;
    address: string | null;
    status: string;

    // Appointment-specific
    preferred_date?: string | null;
    preferred_time?: string | null;
    appointment_date?: string | null;
    appointment_time_from?: string | null;
    appointment_time_until?: string | null;

    // WorkJob-specific
    scheduled_date?: string | null;
    scheduled_time_from?: string | null;
    scheduled_time_until?: string | null;

    service_type: string | null;
    additional_notes?: string | null;
    notes?: string | null;

    has_quotation: boolean;
    items: TrackingItem[];
    grand_total: number;
    discount: number;
    quotation_notes: string | null;

    workers: string[];
    remarks: TrackingRemark[];
}

interface TrackingProps {
    result: TrackingResult | null;
    error: string | null;
}

// ─── Status helpers ───────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
    string,
    { label: string; color: string; bg: string; dot: string }
> = {
    pending: {
        label: 'Pending',
        color: '#92400e',
        bg: '#fffbeb',
        dot: '#f59e0b',
    },
    confirmed: {
        label: 'Confirmed',
        color: '#065f46',
        bg: '#ecfdf5',
        dot: '#10b981',
    },
    completed: {
        label: 'Completed',
        color: '#1e3a5f',
        bg: '#eef2f8',
        dot: '#2c5282',
    },
    cancelled: {
        label: 'Cancelled',
        color: '#7f1d1d',
        bg: '#fef2f2',
        dot: '#ef4444',
    },
    in_progress: {
        label: 'In Progress',
        color: '#1e40af',
        bg: '#eff6ff',
        dot: '#3b82f6',
    },
    inspected: {
        label: 'Inspected',
        color: '#065f46',
        bg: '#ecfdf5',
        dot: '#10b981',
    },
    quoted: {
        label: 'Quoted',
        color: '#3730a3',
        bg: '#eef2ff',
        dot: '#6366f1',
    },
    for_acceptance: {
        label: 'For Acceptance',
        color: '#92400e',
        bg: '#fffbeb',
        dot: '#f59e0b',
    },
    paid: { label: 'Paid', color: '#065f46', bg: '#ecfdf5', dot: '#10b981' },
};

function getStatus(s: string) {
    return (
        STATUS_CONFIG[s?.toLowerCase()] ?? {
            label: s ?? 'Unknown',
            color: '#475569',
            bg: '#f8fafc',
            dot: '#94a3b8',
        }
    );
}

// ─── Progress pipeline ────────────────────────────────────────────────────────

const APPOINTMENT_PIPELINE = [
    'pending',
    'confirmed',
    'inspected',
    'quoted',
    'for_payment',
    'paid',
    'completed',
];
const WORKJOB_PIPELINE = ['pending', 'confirmed', 'in_progress', 'completed'];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number) {
    return Number(n).toLocaleString('en-PH', { minimumFractionDigits: 0 });
}

function formatDate(d: string | null | undefined) {
    if (!d) return '—';
    return new Date(d + 'T00:00:00').toLocaleDateString('en-PH', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
}

function formatDateTime(
    d: string | null | undefined,
    from?: string | null,
    until?: string | null,
) {
    if (!d) return '—';
    const date = formatDate(d);
    if (from && until) return `${date} · ${from} – ${until}`;
    if (from) return `${date} · ${from}`;
    return date;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
    const cfg = getStatus(status);
    return (
        <span
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold"
            style={{ background: cfg.bg, color: cfg.color }}
        >
            <span
                className="h-1.5 w-1.5 flex-shrink-0 rounded-full"
                style={{ background: cfg.dot }}
            />
            {cfg.label}
        </span>
    );
}

function ProgressBar({
    status,
    type,
}: {
    status: string;
    type: 'appointment' | 'work_job';
}) {
    const pipeline =
        type === 'work_job' ? WORKJOB_PIPELINE : APPOINTMENT_PIPELINE;
    const currentIdx = pipeline.indexOf(status?.toLowerCase());
    const effectiveIdx = currentIdx === -1 ? 0 : currentIdx;

    return (
        <div
            className="px-6 py-5"
            style={{ borderBottom: '1px solid #f1f5f9' }}
        >
            <p className="mb-4 text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                Progress
            </p>
            <div className="relative">
                {/* Track */}
                <div
                    className="absolute top-3.5 right-0 left-0 h-0.5"
                    style={{ background: '#e2e8f0' }}
                />
                {/* Fill */}
                <div
                    className="absolute top-3.5 left-0 h-0.5 transition-all duration-700"
                    style={{
                        background: 'linear-gradient(90deg,#1a2332,#2c5282)',
                        width:
                            pipeline.length <= 1
                                ? '100%'
                                : `${(effectiveIdx / (pipeline.length - 1)) * 100}%`,
                    }}
                />
                {/* Steps */}
                <div className="relative flex justify-between">
                    {pipeline.map((step, i) => {
                        const cfg = getStatus(step);
                        const done = i <= effectiveIdx;
                        const active = i === effectiveIdx;
                        return (
                            <div
                                key={step}
                                className="flex flex-col items-center gap-2"
                            >
                                <div
                                    className="flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-bold transition-all duration-300"
                                    style={{
                                        background: done
                                            ? 'linear-gradient(135deg,#1a2332,#2c5282)'
                                            : 'white',
                                        border: done
                                            ? 'none'
                                            : '2px solid #e2e8f0',
                                        color: done ? 'white' : '#94a3b8',
                                        boxShadow: active
                                            ? '0 0 0 3px rgba(44,82,130,0.2)'
                                            : undefined,
                                        zIndex: 1,
                                    }}
                                >
                                    {done && !active ? '✓' : i + 1}
                                </div>
                                <span
                                    className="max-w-[52px] text-center text-[9px] leading-tight font-semibold capitalize"
                                    style={{
                                        color: done ? '#2c5282' : '#94a3b8',
                                    }}
                                >
                                    {cfg.label}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

function InfoGrid({ pairs }: { pairs: { label: string; value: string }[] }) {
    return (
        <div
            className="grid grid-cols-1 gap-4 px-6 py-5 sm:grid-cols-2"
            style={{ borderBottom: '1px solid #f1f5f9' }}
        >
            {pairs.map((d) => (
                <div key={d.label}>
                    <p className="mb-1 text-[10px] font-bold tracking-wide text-slate-400 uppercase">
                        {d.label}
                    </p>
                    <p className="text-[13px] leading-snug font-semibold break-words text-slate-800">
                        {d.value || '—'}
                    </p>
                </div>
            ))}
        </div>
    );
}

function ItemsList({ items }: { items: TrackingItem[] }) {
    if (!items.length) return null;
    return (
        <div
            className="px-6 py-4"
            style={{ borderBottom: '1px solid #f1f5f9' }}
        >
            <p className="mb-3 text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                Items ({items.length})
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
                                                background: '#eef2f8',
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
                                {item.pieces} pc{item.pieces !== 1 ? 's' : ''}
                            </p>
                            <p
                                className="text-[13px] font-extrabold"
                                style={{ color: '#2c5282' }}
                            >
                                ₱{fmt(Math.round(item.total_amount))}
                            </p>
                            {item.status && (
                                <div className="mt-1">
                                    <StatusBadge status={item.status} />
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function WorkersRow({ workers }: { workers: string[] }) {
    if (!workers.length) return null;
    return (
        <div
            className="px-6 py-4"
            style={{ borderBottom: '1px solid #f1f5f9' }}
        >
            <p className="mb-2 text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                Assigned Team
            </p>
            <div className="flex flex-wrap gap-2">
                {workers.map((w) => (
                    <span
                        key={w}
                        className="rounded-xl px-3 py-1.5 text-[12px] font-semibold"
                        style={{ background: '#eef2f8', color: '#2c5282' }}
                    >
                        👷 {w}
                    </span>
                ))}
            </div>
        </div>
    );
}

function RemarksList({ remarks }: { remarks: TrackingRemark[] }) {
    if (!remarks.length) return null;
    return (
        <div
            className="px-6 py-4"
            style={{ borderBottom: '1px solid #f1f5f9' }}
        >
            <p className="mb-3 text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                Updates ({remarks.length})
            </p>
            <div className="space-y-3">
                {remarks.map((r, i) => (
                    <div
                        key={i}
                        className="flex gap-3 rounded-xl p-3"
                        style={{
                            background: '#f8fafc',
                            border: '1px solid #f1f5f9',
                        }}
                    >
                        <div
                            className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-[14px]"
                            style={{ background: '#eef2f8' }}
                        >
                            📋
                        </div>
                        <div className="min-w-0 flex-1">
                            <div className="mb-1 flex flex-wrap items-center gap-2">
                                <span className="text-[11px] font-bold text-slate-700">
                                    {r.by}
                                </span>
                                {r.action && (
                                    <span
                                        className="rounded px-1.5 py-0.5 text-[9px] font-semibold capitalize"
                                        style={{
                                            background: '#eef2f8',
                                            color: '#2c5282',
                                        }}
                                    >
                                        {r.action}
                                    </span>
                                )}
                                <span className="text-[10px] text-slate-400">
                                    {r.created_at}
                                </span>
                            </div>
                            <p className="text-[12px] leading-relaxed text-slate-600">
                                {r.message}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ─── Search form ──────────────────────────────────────────────────────────────

function SearchForm({
    initialValue = '',
    error,
}: {
    initialValue?: string;
    error: string | null;
}) {
    const [ref, setRef] = useState(initialValue);
    const [loading, setLoading] = useState(false);

    function handleSubmit(e: FormEvent) {
        e.preventDefault();
        if (!ref.trim()) return;
        setLoading(true);
        router.post(
            '/track',
            { reference: ref.trim() },
            {
                onFinish: () => setLoading(false),
                preserveScroll: false,
            },
        );
    }

    return (
        <div className="mx-auto max-w-xl px-4 sm:px-6">
            <form onSubmit={handleSubmit}>
                <div
                    className="overflow-hidden rounded-2xl sm:rounded-3xl"
                    style={{
                        background: 'white',
                        border: '1.5px solid #e2e8f0',
                        boxShadow: '0 8px 40px rgba(44,82,130,0.10)',
                    }}
                >
                    <div className="px-6 py-6 sm:px-8 sm:py-7">
                        <label
                            htmlFor="reference"
                            className="mb-2 block text-[11px] font-bold tracking-widest text-slate-400 uppercase"
                        >
                            Appointment or Work Job Number
                        </label>
                        <div className="flex gap-2">
                            <input
                                id="reference"
                                type="text"
                                value={ref}
                                onChange={(e) =>
                                    setRef(e.target.value.toUpperCase())
                                }
                                placeholder="e.g. APT-2024-0001 or WJ-2024-0001"
                                className="min-w-0 flex-1 rounded-xl px-4 py-3 text-[13px] font-semibold text-slate-900 placeholder-slate-400 transition-all outline-none"
                                style={{
                                    background: '#f8fafc',
                                    border: error
                                        ? '1.5px solid #ef4444'
                                        : '1.5px solid #e2e8f0',
                                }}
                                autoComplete="off"
                                spellCheck={false}
                            />
                            <button
                                type="submit"
                                disabled={loading || !ref.trim()}
                                className="flex-shrink-0 rounded-xl px-5 py-3 text-[13px] font-bold text-white transition-opacity disabled:opacity-50"
                                style={{
                                    background:
                                        'linear-gradient(135deg,#1a2332,#2c5282)',
                                }}
                            >
                                {loading ? '…' : 'Track'}
                            </button>
                        </div>

                        {error && (
                            <div
                                className="mt-3 flex items-start gap-2 rounded-xl p-3"
                                style={{
                                    background: '#fef2f2',
                                    border: '1px solid #fecaca',
                                }}
                            >
                                <span className="flex-shrink-0 text-[14px]">
                                    ⚠️
                                </span>
                                <p className="text-[12px] leading-relaxed text-red-700">
                                    {error}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </form>
        </div>
    );
}

// ─── Result card ──────────────────────────────────────────────────────────────

function ResultCard({ result }: { result: TrackingResult }) {
    const isWorkJob = result.type === 'work_job';
    const cfg = getStatus(result.status);

    const scheduledDate = isWorkJob
        ? formatDateTime(
              result.scheduled_date,
              result.scheduled_time_from,
              result.scheduled_time_until,
          )
        : result.appointment_date
          ? formatDateTime(
                result.appointment_date,
                result.appointment_time_from,
                result.appointment_time_until,
            )
          : null;

    const infoItems: { label: string; value: string }[] = [
        { label: 'Full Name', value: result.full_name },
        { label: 'Phone', value: result.phone_number },
        { label: 'Email', value: result.email },
        ...(result.address
            ? [{ label: 'Address', value: result.address }]
            : []),
        ...(result.service_type
            ? [{ label: 'Service Type', value: result.service_type }]
            : []),
        ...(!isWorkJob && result.preferred_date
            ? [
                  {
                      label: 'Preferred Date',
                      value:
                          formatDate(result.preferred_date) +
                          (result.preferred_time
                              ? ` · ${result.preferred_time}`
                              : ''),
                  },
              ]
            : []),
        ...(scheduledDate
            ? [
                  {
                      label: isWorkJob ? 'Scheduled Date' : 'Inspection Date',
                      value: scheduledDate,
                  },
              ]
            : []),
    ];

    return (
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
            <div
                className="overflow-hidden rounded-2xl sm:rounded-3xl"
                style={{
                    background: 'white',
                    border: '1.5px solid #e2e8f0',
                    boxShadow: '0 20px 60px rgba(44,82,130,0.12)',
                }}
            >
                {/* Card header */}
                <div
                    className="flex flex-col gap-3 px-6 py-5 sm:flex-row sm:items-center sm:justify-between"
                    style={{
                        background: 'linear-gradient(135deg,#1a2332,#2c5282)',
                    }}
                >
                    <div>
                        <p
                            className="mb-1 text-[10px] font-bold tracking-widest uppercase"
                            style={{ color: 'rgba(255,255,255,0.5)' }}
                        >
                            {isWorkJob ? 'Work Job' : 'Appointment'}
                        </p>
                        <p className="text-[20px] font-extrabold tracking-wide text-white sm:text-[24px]">
                            {result.reference_number}
                        </p>
                        <p
                            className="mt-0.5 text-[12px]"
                            style={{ color: 'rgba(255,255,255,0.6)' }}
                        >
                            {result.full_name}
                        </p>
                    </div>
                    <div className="flex flex-col items-start gap-2 sm:items-end">
                        <span
                            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-bold"
                            style={{
                                background: 'rgba(255,255,255,0.15)',
                                color: 'white',
                                border: '1px solid rgba(255,255,255,0.2)',
                            }}
                        >
                            <span
                                className="h-1.5 w-1.5 rounded-full"
                                style={{ background: cfg.dot }}
                            />
                            {cfg.label}
                        </span>
                        {result.workers.length > 0 && (
                            <span
                                className="text-[11px]"
                                style={{ color: 'rgba(255,255,255,0.55)' }}
                            >
                                👷 {result.workers.join(', ')}
                            </span>
                        )}
                    </div>
                </div>

                {/* Progress */}
                {/* <ProgressBar status={result.status} type={result.type} /> */}

                {/* Info grid */}
                <InfoGrid pairs={infoItems} />

                {/* Workers */}
                {result.workers.length > 0 && (
                    <WorkersRow workers={result.workers} />
                )}

                {/* Items */}
                {result.has_quotation && result.items.length > 0 && (
                    <ItemsList items={result.items} />
                )}

                {/* Total */}
                {result.has_quotation && result.items.length > 0 && (
                    <div
                        className="flex flex-col gap-3 px-6 py-4 sm:flex-row sm:items-center sm:justify-between"
                        style={{
                            background: '#f8fafc',
                            borderTop: '1.5px solid #f1f5f9',
                        }}
                    >
                        {result.quotation_notes && (
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
                                    {result.quotation_notes}
                                </p>
                            </div>
                        )}
                        <div className="flex-shrink-0 flex items-end justify-end w-full sm:pl-6">
                            <div>
                                {result.discount > 0 && (
                                    <p className="mb-0.5 text-[10px] font-semibold text-green-600">
                                        Discount −₱
                                        {fmt(Math.round(result.discount))}
                                    </p>
                                )}
                                <p className="mb-0.5 text-[10px] text-slate-400">
                                    Total
                                </p>
                                <p
                                    className="text-[24px] font-extrabold sm:text-[28px]"
                                    style={{ color: '#2c5282' }}
                                >
                                    ₱{fmt(Math.round(result.grand_total))}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Remarks */}
                {result.remarks.length > 0 && (
                    <RemarksList remarks={result.remarks} />
                )}

                {/* Notes */}
                {(result.additional_notes || result.notes) && (
                    <div className="px-6 py-4">
                        <p className="mb-2 text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                            Notes
                        </p>
                        <p className="text-[13px] leading-relaxed text-slate-600">
                            {result.additional_notes || result.notes}
                        </p>
                    </div>
                )}

                {/* No quotation yet */}
                {!result.has_quotation && (
                    <div className="px-6 py-5">
                        <div
                            className="flex items-start gap-3 rounded-xl p-4"
                            style={{
                                background: '#f8fafc',
                                border: '1.5px solid #f1f5f9',
                            }}
                        >
                            <span className="flex-shrink-0 text-[20px]">
                                🔍
                            </span>
                            <div>
                                <p className="mb-1 text-[13px] font-bold text-slate-800">
                                    Quotation Not Yet Available
                                </p>
                                <p className="text-[12px] leading-relaxed text-slate-500">
                                    Your on-site inspection hasn't been
                                    completed yet. Once our technician finishes
                                    the visit, your detailed quotation will
                                    appear here.
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Tracking({ result, error }: TrackingProps) {
    // Grab from flash / URL on initial load for pre-filling
    const { url } = usePage();
    const urlRef =
        new URLSearchParams(url.split('?')[1] ?? '').get('ref') ?? '';

    return (
        <>
            <Head title="Track Your Request — SOG Glass & Aluminum" />

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
                        <div className="mb-6 flex justify-center">
                            <div
                                className="flex h-20 w-20 items-center justify-center rounded-full text-[32px] sm:h-24 sm:w-24 sm:text-[36px]"
                                style={{
                                    background: 'rgba(255,255,255,0.15)',
                                    border: '2px solid rgba(255,255,255,0.3)',
                                }}
                            >
                                🔍
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
                                Order Tracking
                            </span>
                        </div>

                        <h1 className="mb-4 text-[28px] leading-tight font-extrabold text-white sm:text-[40px]">
                            Track Your Request
                        </h1>
                        <p
                            className="mx-auto max-w-md text-[14px] leading-relaxed sm:text-[16px]"
                            style={{ color: 'rgba(255,255,255,0.65)' }}
                        >
                            Enter your appointment or work job number to check
                            the status of your request and see your quotation
                            details.
                        </p>
                    </div>
                </div>

                {/* ── SEARCH CARD (overlaps hero) ── */}
                <div className="relative z-10 -mt-14 mb-8 sm:-mt-16">
                    <SearchForm
                        initialValue={urlRef}
                        error={result ? null : error}
                    />
                </div>

                {/* ── RESULT ── */}
                {result && (
                    <div className="mb-12">
                        <ResultCard result={result} />
                    </div>
                )}

                {/* ── EMPTY HELP TEXT ── */}
                {!result && !error && (
                    <div className="mx-auto mb-16 max-w-xl px-4 sm:px-6">
                        <div
                            className="rounded-2xl p-6 sm:rounded-3xl sm:p-8"
                            style={{
                                background: 'white',
                                border: '1.5px solid #e2e8f0',
                            }}
                        >
                            <p className="mb-4 text-[11px] font-bold tracking-widest text-slate-400 uppercase">
                                Where to find your reference number
                            </p>
                            <div className="space-y-3">
                                {[
                                    {
                                        icon: '📧',
                                        title: 'Confirmation email',
                                        desc: 'Check the email we sent after you submitted your quote request.',
                                    },
                                    {
                                        icon: '🖨️',
                                        title: 'Printed confirmation',
                                        desc: 'Your reference number is on the printed page from our quote success screen.',
                                    },
                                    {
                                        icon: '💬',
                                        title: 'Contact us directly',
                                        desc: "Call or message us and we'll help you locate your appointment.",
                                    },
                                ].map((tip) => (
                                    <div
                                        key={tip.title}
                                        className="flex items-start gap-3"
                                    >
                                        <span className="flex-shrink-0 text-[18px]">
                                            {tip.icon}
                                        </span>
                                        <div>
                                            <p className="text-[13px] font-bold text-slate-800">
                                                {tip.title}
                                            </p>
                                            <p className="text-[12px] leading-relaxed text-slate-500">
                                                {tip.desc}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* ── CONTACT BAR (always shown) ── */}
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
                                Need help?
                            </p>
                            <p className="text-[12px] leading-relaxed text-slate-500">
                                Can't find your reference number or have
                                questions about your request? We're here to
                                help.
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <a
                                href="tel:+639000000000"
                                className="rounded-xl px-4 py-2.5 text-[12px] font-bold no-underline"
                                style={{
                                    background: '#eef2f8',
                                    color: '#2c5282',
                                }}
                            >
                                📞 Call Us
                            </a>
                            <a
                                href="https://m.me/"
                                className="rounded-xl px-4 py-2.5 text-[12px] font-bold no-underline"
                                style={{
                                    background: '#eef2f8',
                                    color: '#2c5282',
                                }}
                            >
                                💬 Messenger
                            </a>
                            <Link
                                href="/get-quote"
                                className="rounded-xl px-4 py-2.5 text-[12px] font-bold no-underline"
                                style={{
                                    background: '#eef2f8',
                                    color: '#2c5282',
                                }}
                            >
                                + New Quote
                            </Link>
                        </div>
                    </div>
                </div>

                <Footer />
            </div>
        </>
    );
}
