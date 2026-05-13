import { Head, useForm, Link } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { MultiSelect } from '@/components/multi-select';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    CheckCircle2,
    Loader2,
    User,
    Phone,
    Mail,
    MapPin,
    Wrench,
    CalendarDays,
    Clock,
    Users,
    FileText,
    ArrowLeft,
    Sparkles,
} from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Work Jobs', href: '/work-jobs' },
    { title: 'Create Work Job', href: '#' },
];

interface Worker {
    id: number;
    full_name: string;
}

interface FromAppointment {
    id: number;
    appointment_number: string;
    first_name: string;
    last_name: string;
    phone_number: string;
    email: string;
    address: string;
    address_pinned: string;
    address_lat: string;
    address_lng: string;
    service_type: string;
    service_type_other: string;
    scheduled_date: string | null;
    scheduled_time_from: string | null;
    scheduled_time_until: string | null;
    worker_ids: number[];
    quotation: any | null;
}

const SERVICE_TYPES = [
    'installation',
    'repair',
    'replacement',
    'fabrication',
    'consultation',
    'other',
];

export default function Create({
    workers,
    fromAppointment,
}: {
    workers: Worker[];
    fromAppointment: FromAppointment | null;
}) {
    const isFromAppointment = !!fromAppointment;

    const { data, setData, post, processing, errors } = useForm({
        appointment_id: fromAppointment?.id ?? null,
        quotation_id: fromAppointment?.quotation?.id ?? null,
        first_name: fromAppointment?.first_name ?? '',
        last_name: fromAppointment?.last_name ?? '',
        phone_number: fromAppointment?.phone_number ?? '',
        email: fromAppointment?.email ?? '',
        address: fromAppointment?.address ?? '',
        address_pinned: fromAppointment?.address_pinned ?? '',
        address_lat: fromAppointment?.address_lat ?? '',
        address_lng: fromAppointment?.address_lng ?? '',
        service_type: fromAppointment?.service_type ?? '',
        service_type_other: fromAppointment?.service_type_other ?? '',
        scheduled_date: fromAppointment?.scheduled_date ?? '',
        scheduled_time_from: fromAppointment?.scheduled_time_from ?? '',
        scheduled_time_until: fromAppointment?.scheduled_time_until ?? '',
        notes: '',
        worker_ids: fromAppointment?.worker_ids ?? ([] as number[]),
    });

    const workerOptions = workers.map((w) => ({
        label: w.full_name,
        value: String(w.id),
    }));

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/work-jobs');
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Create Work Job" />

            <div className="space-y-6">
                {/* Page header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">
                            Create Work Job
                        </h1>
                        {isFromAppointment && (
                            <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                                Pre-filled from appointment{' '}
                                <span className="font-semibold text-primary">
                                    {fromAppointment.appointment_number}
                                </span>
                            </div>
                        )}
                    </div>
                    <Link href="/work-jobs">
                        <Button variant="outline" size="sm">
                            <ArrowLeft size={14} />
                            Back
                        </Button>
                    </Link>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="grid gap-6 lg:grid-cols-3">
                        {/* ── Left: main form ── */}
                        <div className="space-y-6 lg:col-span-2">
                            {/* Customer Information */}
                            <Section
                                title="Customer Information"
                                icon={<User size={14} />}
                            >
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <FormField
                                        label="First Name"
                                        error={errors.first_name}
                                    >
                                        <Input
                                            value={data.first_name}
                                            onChange={(e) =>
                                                setData(
                                                    'first_name',
                                                    e.target.value,
                                                )
                                            }
                                            placeholder="Juan"
                                        />
                                    </FormField>
                                    <FormField
                                        label="Last Name"
                                        error={errors.last_name}
                                    >
                                        <Input
                                            value={data.last_name}
                                            onChange={(e) =>
                                                setData(
                                                    'last_name',
                                                    e.target.value,
                                                )
                                            }
                                            placeholder="dela Cruz"
                                        />
                                    </FormField>
                                    <FormField
                                        label="Phone Number"
                                        error={errors.phone_number}
                                        icon={<Phone size={13} />}
                                    >
                                        <Input
                                            value={data.phone_number}
                                            onChange={(e) =>
                                                setData(
                                                    'phone_number',
                                                    e.target.value,
                                                )
                                            }
                                            placeholder="09XX XXX XXXX"
                                        />
                                    </FormField>
                                    <FormField
                                        label="Email"
                                        error={errors.email}
                                        icon={<Mail size={13} />}
                                        optional
                                    >
                                        <Input
                                            type="email"
                                            value={data.email}
                                            onChange={(e) =>
                                                setData('email', e.target.value)
                                            }
                                            placeholder="juan@example.com"
                                        />
                                    </FormField>
                                    <div className="col-span-2">
                                        <FormField
                                            label="Full Address"
                                            error={errors.address}
                                            optional
                                        >
                                            <Textarea
                                                value={data.address}
                                                onChange={(e) =>
                                                    setData(
                                                        'address',
                                                        e.target.value,
                                                    )
                                                }
                                                rows={2}
                                                placeholder="Street, Barangay, City, Province"
                                                className="resize-none"
                                            />
                                        </FormField>
                                    </div>
                                </div>
                            </Section>

                            {/* Service */}
                            <Section
                                title="Service"
                                icon={<Wrench size={14} />}
                            >
                                <div className="grid gap-4 sm:grid-cols-1">
                                    <FormField
                                        label="Service Type"
                                        error={errors.service_type}
                                    >
                                        <Select
                                            value={data.service_type}
                                            onValueChange={(v) =>
                                                setData('service_type', v)
                                            }
                                        >
                                            <SelectTrigger className="w-full">
                                                <SelectValue placeholder="Select service type" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {SERVICE_TYPES.map((s) => (
                                                    <SelectItem
                                                        key={s}
                                                        value={s}
                                                        className="capitalize"
                                                    >
                                                        {s}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </FormField>
                                    {data.service_type === 'other' && (
                                        <FormField
                                            label="Specify Service"
                                            error={errors.service_type_other}
                                        >
                                            <Input
                                                value={data.service_type_other}
                                                onChange={(e) =>
                                                    setData(
                                                        'service_type_other',
                                                        e.target.value,
                                                    )
                                                }
                                                placeholder="Describe the service"
                                            />
                                        </FormField>
                                    )}
                                </div>
                                <FormField
                                    label="Notes"
                                    error={errors.notes}
                                    optional
                                >
                                    <Textarea
                                        value={data.notes}
                                        onChange={(e) =>
                                            setData('notes', e.target.value)
                                        }
                                        rows={3}
                                        placeholder="Special instructions, materials needed, access requirements…"
                                        className="resize-none"
                                    />
                                </FormField>
                            </Section>
                        </div>

                        {/* ── Right: scheduling + workers ── */}
                        <div className="space-y-6">
                            <Section
                                title="Schedule"
                                icon={<CalendarDays size={14} />}
                            >
                                <FormField
                                    label="Date"
                                    error={errors.scheduled_date}
                                >
                                    <Input
                                        type="date"
                                        value={data.scheduled_date}
                                        onChange={(e) =>
                                            setData(
                                                'scheduled_date',
                                                e.target.value,
                                            )
                                        }
                                    />
                                </FormField>
                                <div className="grid grid-cols-2 gap-3">
                                    <FormField
                                        label="From"
                                        error={errors.scheduled_time_from}
                                    >
                                        <Input
                                            type="time"
                                            value={data.scheduled_time_from}
                                            onChange={(e) =>
                                                setData(
                                                    'scheduled_time_from',
                                                    e.target.value,
                                                )
                                            }
                                        />
                                    </FormField>
                                    <FormField
                                        label="Until"
                                        error={errors.scheduled_time_until}
                                    >
                                        <Input
                                            type="time"
                                            value={data.scheduled_time_until}
                                            onChange={(e) =>
                                                setData(
                                                    'scheduled_time_until',
                                                    e.target.value,
                                                )
                                            }
                                        />
                                    </FormField>
                                </div>
                            </Section>

                            <Section
                                title="Assign Workers"
                                icon={<Users size={14} />}
                            >
                                <FormField
                                    label="Workers"
                                    error={errors.worker_ids}
                                >
                                    <MultiSelect
                                        options={workerOptions}
                                        defaultValue={data.worker_ids.map(
                                            String,
                                        )}
                                        onValueChange={(vals) =>
                                            setData(
                                                'worker_ids',
                                                vals.map(Number),
                                            )
                                        }
                                    />
                                </FormField>
                            </Section>

                            {/* Linked quotation info */}
                            {isFromAppointment && fromAppointment.quotation && (
                                <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
                                    <div className="flex items-center gap-2 text-xs font-semibold text-primary">
                                        <FileText size={13} />
                                        Quotation Linked
                                    </div>
                                    <p className="mt-1 text-xs text-muted-foreground">
                                        The existing quotation (
                                        {
                                            fromAppointment.quotation
                                                .quotation_items.length
                                        }{' '}
                                        item
                                        {fromAppointment.quotation
                                            .quotation_items.length !== 1
                                            ? 's'
                                            : ''}
                                        ) from the appointment will be
                                        automatically linked to this work job.
                                    </p>
                                </div>
                            )}

                            <Button
                                type="submit"
                                disabled={processing}
                                className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                            >
                                {processing ? (
                                    <Loader2
                                        size={14}
                                        className="animate-spin"
                                    />
                                ) : (
                                    <CheckCircle2 size={14} />
                                )}
                                Create Work Job
                            </Button>
                        </div>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}

// ── Shared sub-components ──────────────────────────────────────────────────────

function Section({
    title,
    icon,
    children,
}: {
    title: string;
    icon: React.ReactNode;
    children: React.ReactNode;
}) {
    return (
        <div className="space-y-4 rounded-2xl border border-border bg-card p-6 shadow-sm">
            <h2 className="flex items-center gap-1.5 text-xs font-semibold tracking-widest text-primary uppercase">
                {icon}
                {title}
            </h2>
            {children}
        </div>
    );
}

function FormField({
    label,
    error,
    optional,
    icon,
    children,
}: {
    label: string;
    error?: string;
    optional?: boolean;
    icon?: React.ReactNode;
    children: React.ReactNode;
}) {
    return (
        <div className="flex flex-col gap-1.5">
            <Label className="flex items-center gap-1.5">
                {icon}
                {label}
                {optional && (
                    <span className="font-normal text-muted-foreground">
                        (optional)
                    </span>
                )}
            </Label>
            {children}
            {error && <span className="text-xs text-red-500">{error}</span>}
        </div>
    );
}
