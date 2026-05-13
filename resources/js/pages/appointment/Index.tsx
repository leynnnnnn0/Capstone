import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';
import Pagination from '@/components/pagination';
import { STATUS_COLORS } from '@/constants/statusColor';
import {
    Eye,
    Search,
    SlidersHorizontal,
    CalendarDays,
    RotateCcw,
    MoreHorizontal,
    Download,
    UserCheck,
    ClipboardList,
    ChevronUp,
    ChevronDown,
    ChevronsUpDown,
} from 'lucide-react';
import { useCallback, useState } from 'react';
import { useDebouncedCallback } from 'use-debounce';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Appointment {
    id: number;
    appointment_number: string;
    full_name: string;
    phone_number: string;
    email: string;
    preferred_time: string;
    preferred_date_formatted: string;
    service_type: string;
    status: string;
}

interface PaginatedAppointments {
    data: Appointment[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
}

interface Filters {
    search?: string;
    status?: string;
    service_type?: string;
    date_from?: string;
    date_to?: string;
    sort_by?: string;
    sort_dir?: 'asc' | 'desc';
    per_page?: number;
}

interface Props {
    appointments: PaginatedAppointments;
    filters: Filters;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Appointments', href: '/appointments' },
];

const STATUS_OPTIONS = [
    { value: 'all', label: 'All Statuses' },
    { value: 'pending', label: 'Pending' },
    { value: 'confirmed', label: 'Confirmed' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' },
];

const SERVICE_OPTIONS = [
    { value: 'all', label: 'All Services' },
    { value: 'cleaning', label: 'Cleaning' },
    { value: 'repair', label: 'Repair' },
    { value: 'installation', label: 'Installation' },
    { value: 'inspection', label: 'Inspection' },
    { value: 'other', label: 'Other' },
];

const PER_PAGE_OPTIONS = [10, 25, 50, 100];



// ─── Sub-components ───────────────────────────────────────────────────────────

function SortIcon({
    column,
    sortBy,
    sortDir,
}: {
    column: string;
    sortBy?: string;
    sortDir?: string;
}) {
    if (sortBy !== column)
        return (
            <ChevronsUpDown className="ml-1 inline size-3.5 text-muted-foreground/50" />
        );
    return sortDir === 'asc' ? (
        <ChevronUp className="ml-1 inline size-3.5 text-primary" />
    ) : (
        <ChevronDown className="ml-1 inline size-3.5 text-primary" />
    );
}

function StatCard({
    label,
    value,
    icon: Icon,
}: {
    label: string;
    value: number | string;
    icon: any;
    colorClass: string;
}) {
    return (
        <div className="flex items-center gap-3 rounded-lg border bg-card px-4 py-3">
            <div
                className={`flex size-9 shrink-0 items-center justify-center rounded-md}`}
            >
                <Icon className="size-4" />
            </div>
            <div>
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="text-lg leading-tight font-semibold">{value}</p>
            </div>
        </div>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Index({ appointments, filters = {} }: Props) {
    console.log(appointments);
    const [localSearch, setLocalSearch] = useState(filters.search ?? '');
    const [isFiltersOpen, setIsFiltersOpen] = useState(false);

    const hasActiveFilters =
        (filters.search && filters.search !== '') ||
        (filters.status && filters.status !== 'all') ||
        (filters.service_type && filters.service_type !== 'all') ||
        filters.date_from ||
        filters.date_to;

    // ── Navigation helper ──
    const applyFilter = useCallback(
        (newFilters: Partial<Filters>) => {
            router.get(
                '/appointments',
                { ...filters, ...newFilters, page: 1 },
                { preserveState: true, replace: true },
            );
        },
        [filters],
    );

    // ── Debounced search ──
    const debouncedSearch = useDebouncedCallback((value: string) => {
        applyFilter({ search: value });
    }, 400);

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        setLocalSearch(e.target.value);
        debouncedSearch(e.target.value);
    };

    // ── Sort ──
    const handleSort = (column: string) => {
        const newDir =
            filters.sort_by === column && filters.sort_dir === 'asc'
                ? 'desc'
                : 'asc';
        applyFilter({ sort_by: column, sort_dir: newDir });
    };

    // ── Reset ──
    const handleReset = () => {
        setLocalSearch('');
        router.get(
            '/appointments',
            {},
            { preserveState: false, replace: true },
        );
    };

    // ─────────────────────────────────────────────────────────────────────────

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Appointments" />

            <TooltipProvider>
                <div className="space-y-4 p-1">
                    {/* ── Header ── */}
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h1 className="text-xl font-semibold tracking-tight">
                                Appointments
                            </h1>
                            <p className="text-sm text-muted-foreground">
                                {appointments.total} total appointment
                                {appointments.total !== 1 ? 's' : ''}
                            </p>
                        </div>

                        <div className="flex shrink-0 items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                className="gap-1.5"
                            >
                                <Download className="size-3.5" />
                                Export
                            </Button>
                            <Button
                                size="sm"
                                className="gap-1.5"
                                onClick={() =>
                                    router.get('/appointments/create')
                                }
                            >
                                <CalendarDays className="size-3.5" />
                                New Appointment
                            </Button>
                        </div>
                    </div>

                    {/* ── Summary Cards ── */}
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                        <StatCard
                            label="Total"
                            value={appointments.total}
                            icon={ClipboardList}
                            colorClass="bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400"
                        />
                        <StatCard
                            label="Pending"
                            value={
                                appointments.data.filter(
                                    (a) => a.status === 'pending',
                                ).length
                            }
                            icon={CalendarDays}
                            colorClass="bg-yellow-50 text-yellow-600 dark:bg-yellow-950 dark:text-yellow-400"
                        />
                        <StatCard
                            label="Confirmed"
                            value={
                                appointments.data.filter(
                                    (a) => a.status === 'confirmed',
                                ).length
                            }
                            icon={UserCheck}
                            colorClass="bg-green-50 text-green-600 dark:bg-green-950 dark:text-green-400"
                        />
                        <StatCard
                            label="Completed"
                            value={
                                appointments.data.filter(
                                    (a) => a.status === 'completed',
                                ).length
                            }
                            icon={ClipboardList}
                            colorClass="bg-purple-50 text-purple-600 dark:bg-purple-950 dark:text-purple-400"
                        />
                    </div>

                    {/* ── Filters Bar ── */}
                    <div className="rounded-lg border bg-card p-3">
                        <div className="flex flex-col gap-3">
                            {/* Row 1: search + toggle */}
                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        placeholder="Search by name, phone, appointment #…"
                                        className="pl-8 text-sm"
                                        value={localSearch}
                                        onChange={handleSearch}
                                    />
                                </div>
                                <Button
                                    variant={
                                        isFiltersOpen ? 'secondary' : 'outline'
                                    }
                                    size="sm"
                                    className="shrink-0 gap-1.5"
                                    onClick={() => setIsFiltersOpen((p) => !p)}
                                >
                                    <SlidersHorizontal className="size-3.5" />
                                    Filters
                                    {hasActiveFilters && (
                                        <span className="flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground">
                                            !
                                        </span>
                                    )}
                                </Button>
                                {hasActiveFilters && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="shrink-0 gap-1.5 text-muted-foreground"
                                        onClick={handleReset}
                                    >
                                        <RotateCcw className="size-3.5" />
                                        Reset
                                    </Button>
                                )}
                            </div>

                            {/* Row 2: expanded filters */}
                            {isFiltersOpen && (
                                <>
                                    <Separator />
                                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                                        {/* Status */}
                                        <div className="space-y-1">
                                            <label className="text-xs font-medium text-muted-foreground">
                                                Status
                                            </label>
                                            <Select
                                                value={filters.status ?? 'all'}
                                                onValueChange={(v) =>
                                                    applyFilter({ status: v })
                                                }
                                            >
                                                <SelectTrigger className="h-8 w-full text-sm">
                                                    <SelectValue placeholder="Status" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {STATUS_OPTIONS.map((o) => (
                                                        <SelectItem
                                                            key={o.value}
                                                            value={o.value}
                                                        >
                                                            {o.label}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        {/* Service Type */}
                                        <div className="space-y-1">
                                            <label className="text-xs font-medium text-muted-foreground">
                                                Service Type
                                            </label>
                                            <Select
                                                value={
                                                    filters.service_type ??
                                                    'all'
                                                }
                                                onValueChange={(v) =>
                                                    applyFilter({
                                                        service_type: v,
                                                    })
                                                }
                                            >
                                                <SelectTrigger className="h-8 w-full text-sm">
                                                    <SelectValue placeholder="Service" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {SERVICE_OPTIONS.map(
                                                        (o) => (
                                                            <SelectItem
                                                                key={o.value}
                                                                value={o.value}
                                                            >
                                                                {o.label}
                                                            </SelectItem>
                                                        ),
                                                    )}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        {/* Date From */}
                                        <div className="space-y-1">
                                            <label className="text-xs font-medium text-muted-foreground">
                                                Date From
                                            </label>
                                            <Input
                                                type="date"
                                                className="h-8 text-sm"
                                                value={filters.date_from ?? ''}
                                                onChange={(e) =>
                                                    applyFilter({
                                                        date_from:
                                                            e.target.value,
                                                    })
                                                }
                                            />
                                        </div>

                                        {/* Date To */}
                                        <div className="space-y-1">
                                            <label className="text-xs font-medium text-muted-foreground">
                                                Date To
                                            </label>
                                            <Input
                                                type="date"
                                                className="h-8 text-sm"
                                                value={filters.date_to ?? ''}
                                                onChange={(e) =>
                                                    applyFilter({
                                                        date_to: e.target.value,
                                                    })
                                                }
                                            />
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* ── Table ── */}
                    <div className="overflow-hidden rounded-lg border bg-card">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Appointment Number</TableHead>
                                    <TableHead>Customer</TableHead>
                                    <TableHead>Phone Number</TableHead>
                                    <TableHead>Prefered Time</TableHead>
                                    <TableHead>Preferred Date</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {appointments.data.length > 0 ? (
                                    appointments.data.map(
                                        (appointment: any) => (
                                            <TableRow key={appointment.id}>
                                                <TableCell className="font-medium">
                                                    {
                                                        appointment.appointment_number
                                                    }
                                                </TableCell>
                                                <TableCell>
                                                    {appointment.full_name}
                                                </TableCell>
                                                <TableCell>
                                                    {appointment.phone_number}
                                                </TableCell>
                                                <TableCell>
                                                    {appointment.preferred_time}
                                                </TableCell>
                                                <TableCell>
                                                    {
                                                        appointment.preferred_date_formatted
                                                    }
                                                </TableCell>
                                                <TableCell>
                                                    <Badge
                                                        className={`capitalize ${STATUS_COLORS[appointment.status].bg ?? 'bg-muted text-muted-foreground'} ${STATUS_COLORS[appointment.status].border ?? 'border-muted'} ${STATUS_COLORS[appointment.status].text ?? 'text-muted-foreground'}`}
                                                    >
                                                        {appointment.status}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="flex items-center">
                                                    <Eye
                                                        onClick={() =>
                                                            router.get(
                                                                `/appointments/${appointment.id}`,
                                                            )
                                                        }
                                                        className="size-5 cursor-pointer text-gray-500"
                                                    />
                                                </TableCell>
                                            </TableRow>
                                        ),
                                    )
                                ) : (
                                    <TableRow>
                                        <TableCell
                                            colSpan={7}
                                            className="py-8 text-center"
                                        >
                                            No appointment found.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>

                        <Pagination data={appointments} />
                    </div>
                </div>
            </TooltipProvider>
        </AppLayout>
    );
}
