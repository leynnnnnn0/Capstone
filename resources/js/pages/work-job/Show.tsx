import { Head, Link, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
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
    Loader2,
    CheckCircle2,
    XCircle,
    PlayCircle,
    ExternalLink,
} from 'lucide-react';
import QuotationDetails from '@/pages/appointment/components/quotation-details';
import LocationCard from '../appointment/components/location-card';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Work Jobs', href: '/work-jobs' },
    { title: 'Work Job Details', href: '#' },
];

const STATUS_STYLES: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-700',
    in_progress: 'bg-blue-100 text-blue-700',
    completed: 'bg-green-100 text-green-700',
    cancelled: 'bg-red-100 text-red-600',
};

const STATUS_LABELS: Record<string, string> = {
    pending: 'Pending',
    in_progress: 'In Progress',
    completed: 'Completed',
    cancelled: 'Cancelled',
};

function formatTime(t: string) {
    if (!t) return t;
    const [h, m] = t.split(':').map(Number);
    return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
}

function formatDate(d: string) {
    if (!d) return d;
    const [y, mo, day] = d.split('-').map(Number);
    return new Date(y, mo - 1, day).toLocaleDateString('en-PH', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
    });
}

export default function WorkJobShow({ workJob, quotation }: any) {
    const { put: putInProgress, processing: startingProgress } = useForm({});
    const { put: putComplete, processing: completing } = useForm({});
    const { put: putCancel, processing: cancelling } = useForm({});

    const canStart = workJob.status === 'pending';
    const canComplete = workJob.status === 'in_progress';
    const canCancel = ['pending', 'in_progress'].includes(workJob.status);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Work Job ${workJob.work_job_number}`} />

            <div className="space-y-6">
                {/* Page header */}
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-xs font-semibold tracking-widest text-primary uppercase">
                            {workJob.work_job_number}
                        </p>
                        <h1 className="mt-1 text-2xl font-bold text-foreground">
                            {workJob.full_name}
                        </h1>
                        {workJob.appointment_number && (
                            <p className="mt-0.5 text-xs text-muted-foreground">
                                From appointment{' '}
                                <Link
                                    href={`/appointments/${workJob.appointment_id}`}
                                    className="inline-flex items-center gap-0.5 font-semibold text-primary hover:underline"
                                >
                                    {workJob.appointment_number}
                                    <ExternalLink size={10} />
                                </Link>
                            </p>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        <Badge
                            className={`capitalize ${STATUS_STYLES[workJob.status] ?? 'bg-muted text-muted-foreground'}`}
                        >
                            {STATUS_LABELS[workJob.status] ?? workJob.status}
                        </Badge>
                        <Link href="/work-jobs">
                            <Button variant="outline" size="sm">
                                <ArrowLeft size={14} />
                                Back
                            </Button>
                        </Link>
                    </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-3">
                    {/* ── Left column ── */}
                    <div className="space-y-6 lg:col-span-2">
                        {/* Customer details */}
                        <Card
                            title="Customer Information"
                            icon={<User size={14} />}
                        >
                            <div className="grid gap-4 sm:grid-cols-2">
                                <Detail
                                    label="Full Name"
                                    icon={<User size={13} />}
                                >
                                    {workJob.full_name}
                                </Detail>
                                <Detail
                                    label="Phone"
                                    icon={<Phone size={13} />}
                                >
                                    {workJob.phone_number}
                                </Detail>
                                {workJob.email && (
                                    <Detail
                                        label="Email"
                                        icon={<Mail size={13} />}
                                    >
                                        {workJob.email}
                                    </Detail>
                                )}
                                <Detail
                                    label="Service"
                                    icon={<Wrench size={13} />}
                                >
                                    <span className="capitalize">
                                        {workJob.service_type}
                                    </span>
                                    {workJob.service_type_other && (
                                        <span className="ml-1 text-muted-foreground">
                                            ({workJob.service_type_other})
                                        </span>
                                    )}
                                </Detail>
                            </div>
                        </Card>

                        {/* Location */}
                        <LocationCard appointment={workJob} />

                        {/* Notes */}
                        {workJob.notes && (
                            <Card title="Notes" icon={<FileText size={14} />}>
                                <p className="text-sm leading-relaxed text-foreground">
                                    {workJob.notes}
                                </p>
                            </Card>
                        )}

                        {/* Quotation */}
                    </div>

                    {/* ── Right column ── */}
                    <div className="space-y-6">
                        {/* Schedule */}
                        <Card
                            title="Schedule"
                            icon={<CalendarDays size={14} />}
                        >
                            <Detail
                                label="Date"
                                icon={<CalendarDays size={13} />}
                            >
                                {formatDate(workJob.scheduled_date)}
                            </Detail>
                            <Detail label="Time" icon={<Clock size={13} />}>
                                {formatTime(workJob.scheduled_time_from)} –{' '}
                                {formatTime(workJob.scheduled_time_until)}
                            </Detail>
                        </Card>

                        {/* Workers */}
                        <Card
                            title="Assigned Workers"
                            icon={<Users size={14} />}
                        >
                            {workJob.workers.length === 0 ? (
                                <p className="text-sm text-muted-foreground">
                                    No workers assigned.
                                </p>
                            ) : (
                                <div className="space-y-2">
                                    {workJob.workers.map((w: any) => (
                                        <div
                                            key={w.id}
                                            className="flex items-center gap-2 rounded-lg bg-muted/40 px-3 py-2 text-sm"
                                        >
                                            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
                                                {w.full_name.charAt(0)}
                                            </div>
                                            {w.full_name}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </Card>

                        {/* Status actions */}
                        {(canStart || canComplete || canCancel) && (
                            <Card
                                title="Update Status"
                                icon={<CheckCircle2 size={14} />}
                            >
                                <div className="flex flex-col gap-2">
                                    {canStart && (
                                        <Button
                                            variant="outline"
                                            disabled={startingProgress}
                                            onClick={() =>
                                                putInProgress(
                                                    `/work-jobs/${workJob.id}/in-progress`,
                                                )
                                            }
                                            className="w-full border-blue-200 text-blue-700 hover:border-blue-300 hover:bg-blue-50"
                                        >
                                            {startingProgress ? (
                                                <Loader2
                                                    size={14}
                                                    className="animate-spin"
                                                />
                                            ) : (
                                                <PlayCircle size={14} />
                                            )}
                                            Mark as In Progress
                                        </Button>
                                    )}
                                    {canComplete && (
                                        <Button
                                            variant="outline"
                                            disabled={completing}
                                            onClick={() =>
                                                putComplete(
                                                    `/work-jobs/${workJob.id}/complete`,
                                                )
                                            }
                                            className="w-full border-green-200 text-green-700 hover:border-green-300 hover:bg-green-50"
                                        >
                                            {completing ? (
                                                <Loader2
                                                    size={14}
                                                    className="animate-spin"
                                                />
                                            ) : (
                                                <CheckCircle2 size={14} />
                                            )}
                                            Mark as Completed
                                        </Button>
                                    )}
                                    {canCancel && (
                                        <Button
                                            variant="outline"
                                            disabled={cancelling}
                                            onClick={() =>
                                                putCancel(
                                                    `/work-jobs/${workJob.id}/cancel`,
                                                )
                                            }
                                            className="w-full border-red-200 text-red-600 hover:border-red-300 hover:bg-red-50"
                                        >
                                            {cancelling ? (
                                                <Loader2
                                                    size={14}
                                                    className="animate-spin"
                                                />
                                            ) : (
                                                <XCircle size={14} />
                                            )}
                                            Cancel Work Job
                                        </Button>
                                    )}
                                </div>
                            </Card>
                        )}

                        {quotation && (
                            <QuotationDetails quotation={quotation} />
                        )}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}

function Card({
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

function Detail({
    label,
    icon,
    children,
}: {
    label: string;
    icon?: React.ReactNode;
    children: React.ReactNode;
}) {
    return (
        <div className="flex flex-col gap-1">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
                {icon}
                {label}
            </div>
            <p className="text-sm text-foreground">{children}</p>
        </div>
    );
}
