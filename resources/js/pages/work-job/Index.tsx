import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Plus,
    Search,
    Briefcase,
    CalendarDays,
    Clock,
    Users,
    ChevronRight,
} from 'lucide-react';
import { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Work Jobs', href: '/work-jobs' },
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
    const period = h >= 12 ? 'PM' : 'AM';
    return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${period}`;
}

function formatDate(d: string) {
    if (!d) return d;
    const [y, mo, day] = d.split('-').map(Number);
    return new Date(y, mo - 1, day).toLocaleDateString('en-PH', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });
}

export default function Index({ workJobs, filters }: any) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [status, setStatus] = useState(filters.status ?? 'all');

    const applyFilters = (overrides: Record<string, string>) => {
        router.get(
            '/work-jobs',
            { search, status, ...overrides },
            {
                preserveState: true,
                replace: true,
            },
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Work Jobs" />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">
                            Work Jobs
                        </h1>
                        <p className="mt-0.5 text-sm text-muted-foreground">
                            Manage all field work orders
                        </p>
                    </div>
                    <Link href="/work-jobs/create">
                        <Button
                            size="sm"
                            className="bg-primary text-primary-foreground hover:bg-primary/90"
                        >
                            <Plus size={14} />
                            New Work Job
                        </Button>
                    </Link>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap gap-3">
                    <div className="relative min-w-48 flex-1">
                        <Search
                            size={14}
                            className="absolute top-1/2 left-3 -translate-y-1/2 text-muted-foreground"
                        />
                        <Input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onKeyDown={(e) =>
                                e.key === 'Enter' && applyFilters({ search })
                            }
                            placeholder="Search by name, number…"
                            className="pl-8"
                        />
                    </div>
                    <Select
                        value={status}
                        onValueChange={(v) => {
                            setStatus(v);
                            applyFilters({ status: v });
                        }}
                    >
                        <SelectTrigger className="w-40">
                            <SelectValue placeholder="All statuses" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Statuses</SelectItem>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="in_progress">
                                In Progress
                            </SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Table */}
                <div className="overflow-hidden border rounded-sm">
                    {workJobs.data.length === 0 ? (
                        <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
                            <Briefcase
                                size={32}
                                className="text-muted-foreground/30"
                            />
                            <p className="text-sm text-muted-foreground">
                                No work jobs found.
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table className="w-full text-sm">
                                <TableHeader>
                                    <TableRow className="border-b border-border bg-muted/40">
                                        <TableHead className="px-4 py-3 text-left text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
                                            Work Job #
                                        </TableHead>
                                        <TableHead className="px-4 py-3 text-left text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
                                            Customer
                                        </TableHead>
                                        <TableHead className="px-4 py-3 text-left text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
                                            Service
                                        </TableHead>
                                        <TableHead className="px-4 py-3 text-left text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
                                            Schedule
                                        </TableHead>
                                        <TableHead className="px-4 py-3 text-left text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
                                            Workers
                                        </TableHead>
                                        <TableHead className="px-4 py-3 text-left text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
                                            Status
                                        </TableHead>
                                        <TableHead className="px-4 py-3" />
                                    </TableRow>
                                </TableHeader>
                                <TableBody className="divide-y divide-border">
                                    {workJobs.data.map((job: any) => (
                                        <TableRow
                                            key={job.id}
                                            className="transition-colors hover:bg-muted/30"
                                        >
                                            <TableCell className="px-4 py-3">
                                                <div className="flex flex-col gap-0.5">
                                                    <span className="text-xs font-bold tracking-wide text-primary">
                                                        {job.work_job_number}
                                                    </span>
                                                    {job.appointment_number && (
                                                        <span className="text-[10px] text-muted-foreground">
                                                            from{' '}
                                                            {
                                                                job.appointment
                                                                    ?.appointment_number
                                                            }
                                                        </span>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="px-4 py-3">
                                                <p className="font-medium text-foreground">
                                                    {job.full_name}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    {job.phone_number}
                                                </p>
                                            </TableCell>
                                            <TableCell className="px-4 py-3 text-foreground capitalize">
                                                {job.service_type}
                                                {job.service_type_other && (
                                                    <span className="ml-1 text-muted-foreground">
                                                        (
                                                        {job.service_type_other}
                                                        )
                                                    </span>
                                                )}
                                            </TableCell>
                                            <TableCell className="px-4 py-3">
                                                <div className="flex items-center gap-1 text-xs text-foreground">
                                                    <CalendarDays
                                                        size={11}
                                                        className="text-muted-foreground"
                                                    />
                                                    {formatDate(
                                                        job.scheduled_date,
                                                    )}
                                                </div>
                                                <div className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                                                    <Clock size={11} />
                                                    {formatTime(
                                                        job.scheduled_time_from,
                                                    )}{' '}
                                                    –{' '}
                                                    {formatTime(
                                                        job.scheduled_time_until,
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="px-4 py-3">
                                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                                    <Users size={11} />
                                                    {job.workers?.length ??
                                                        0}{' '}
                                                    worker
                                                    {job.workers?.length !== 1
                                                        ? 's'
                                                        : ''}
                                                </div>
                                            </TableCell>
                                            <TableCell className="px-4 py-3">
                                                <Badge
                                                    className={`text-[11px] capitalize ${STATUS_STYLES[job.status] ?? 'bg-muted text-muted-foreground'}`}
                                                >
                                                    {STATUS_LABELS[
                                                        job.status
                                                    ] ?? job.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="px-4 py-3">
                                                <Link
                                                    href={`/work-jobs/${job.id}`}
                                                >
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-7 px-2"
                                                    >
                                                        <ChevronRight
                                                            size={14}
                                                        />
                                                    </Button>
                                                </Link>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </div>

                {/* Pagination */}
                {workJobs.last_page > 1 && (
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>
                            Showing {workJobs.from}–{workJobs.to} of{' '}
                            {workJobs.total} work jobs
                        </span>
                        <div className="flex gap-2">
                            {workJobs.prev_page_url && (
                                <Link href={workJobs.prev_page_url}>
                                    <Button variant="outline" size="sm">
                                        Previous
                                    </Button>
                                </Link>
                            )}
                            {workJobs.next_page_url && (
                                <Link href={workJobs.next_page_url}>
                                    <Button variant="outline" size="sm">
                                        Next
                                    </Button>
                                </Link>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
