import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { useEffect, useRef, useState } from 'react';

// shadcn UI
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';

// shadcn Charts (recharts-based)
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
    ChartLegend,
    ChartLegendContent,
} from '@/components/ui/chart';
import {
    AreaChart,
    Area,
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
} from 'recharts';

import {
    CalendarDays,
    Users,
    ClipboardList,
    TrendingUp,
    Clock,
    CheckCircle2,
    AlertCircle,
    XCircle,
    ArrowUpRight,
    ArrowDownRight,
    MapPin,
    Phone,
    Wrench,
} from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// Breadcrumbs
// ─────────────────────────────────────────────────────────────────────────────

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
];

// ─────────────────────────────────────────────────────────────────────────────
// Dummy Data
// ─────────────────────────────────────────────────────────────────────────────

const stats = [
    {
        label: 'Total Appointments',
        value: '284',
        change: '+12%',
        up: true,
        icon: CalendarDays,
        color: 'text-blue-600',
        bg: 'bg-blue-50',
    },
    {
        label: 'Active Users',
        value: '1,340',
        change: '+8%',
        up: true,
        icon: Users,
        color: 'text-emerald-600',
        bg: 'bg-emerald-50',
    },
    {
        label: 'Pending Quotations',
        value: '47',
        change: '-3%',
        up: false,
        icon: ClipboardList,
        color: 'text-amber-600',
        bg: 'bg-amber-50',
    },
    {
        label: 'Revenue (This Month)',
        value: '₱182,500',
        change: '+21%',
        up: true,
        icon: TrendingUp,
        color: 'text-violet-600',
        bg: 'bg-violet-50',
    },
];

const appointmentStatusCounts = {
    pending: 18,
    confirmed: 34,
    completed: 219,
    cancelled: 13,
};

const monthlyData = [
    { month: 'Oct', appointments: 28, revenue: 64000 },
    { month: 'Nov', appointments: 34, revenue: 78000 },
    { month: 'Dec', appointments: 22, revenue: 51000 },
    { month: 'Jan', appointments: 41, revenue: 93000 },
    { month: 'Feb', appointments: 38, revenue: 87500 },
    { month: 'Mar', appointments: 55, revenue: 142000 },
    { month: 'Apr', appointments: 66, revenue: 182500 },
];

const serviceData = [
    { service: 'Window Tinting', count: 98 },
    { service: 'Solar Film', count: 72 },
    { service: 'Glass Replacement', count: 54 },
    { service: 'Decorative Film', count: 38 },
    { service: 'Other', count: 22 },
];

const statusPieData = [
    { name: 'Completed', value: 219, fill: '#10b981' },
    { name: 'Confirmed', value: 34, fill: '#3b82f6' },
    { name: 'Pending', value: 18, fill: '#f59e0b' },
    { name: 'Cancelled', value: 13, fill: '#ef4444' },
];

const calendarEvents = [
    {
        title: 'Maria Santos — Window Tinting',
        date: '2026-04-08',
        color: '#3b82f6',
    },
    {
        title: 'Juan dela Cruz — Glass Replacement',
        date: '2026-04-08',
        color: '#f59e0b',
    },
    { title: 'Ben Torres — Solar Film', date: '2026-04-09', color: '#3b82f6' },
    {
        title: 'Liza Gomez — Decorative Film',
        date: '2026-04-10',
        color: '#3b82f6',
    },
    {
        title: 'Carlo Reyes — Window Tinting',
        date: '2026-04-11',
        color: '#3b82f6',
    },
    {
        title: 'Diana Cruz — Glass Replacement',
        date: '2026-04-14',
        color: '#f59e0b',
    },
    {
        title: 'Ernesto Bautista — Solar Film',
        date: '2026-04-14',
        color: '#3b82f6',
    },
    {
        title: 'Fiona Santos — Decorative Film',
        date: '2026-04-15',
        color: '#3b82f6',
    },
    {
        title: 'George Lim — Window Tinting',
        date: '2026-04-16',
        color: '#f59e0b',
    },
    { title: 'Helen Tan — Solar Film', date: '2026-04-17', color: '#3b82f6' },
    {
        title: 'Ivan Reyes — Glass Replacement',
        date: '2026-04-21',
        color: '#3b82f6',
    },
    {
        title: 'Julia Cruz — Window Tinting',
        date: '2026-04-22',
        color: '#3b82f6',
    },
    {
        title: 'Karl Santos — Decorative Film',
        date: '2026-04-23',
        color: '#f59e0b',
    },
    { title: 'Laura Gomez — Solar Film', date: '2026-04-24', color: '#3b82f6' },
    {
        title: 'Mike Torres — Window Tinting',
        date: '2026-04-28',
        color: '#3b82f6',
    },
    {
        title: 'Nina Bautista — Glass Replacement',
        date: '2026-04-29',
        color: '#3b82f6',
    },
    { title: 'Oscar Lim — Solar Film', date: '2026-04-30', color: '#f59e0b' },
];

const recentAppointments = [
    {
        id: 'APT-0091',
        name: 'Maria Santos',
        service: 'Window Tinting',
        date: 'Apr 8, 2026',
        time: '9:00 AM',
        status: 'confirmed',
        address: 'Bacoor, Cavite',
        phone: '0917-123-4567',
    },
    {
        id: 'APT-0090',
        name: 'Juan dela Cruz',
        service: 'Glass Replacement',
        date: 'Apr 8, 2026',
        time: '11:00 AM',
        status: 'pending',
        address: 'Imus, Cavite',
        phone: '0918-234-5678',
    },
    {
        id: 'APT-0089',
        name: 'Ana Reyes',
        service: 'Solar Film Installation',
        date: 'Apr 7, 2026',
        time: '2:00 PM',
        status: 'completed',
        address: 'Dasmariñas, Cavite',
        phone: '0919-345-6789',
    },
    {
        id: 'APT-0088',
        name: 'Roberto Lim',
        service: 'Window Tinting',
        date: 'Apr 7, 2026',
        time: '10:00 AM',
        status: 'cancelled',
        address: 'General Trias, Cavite',
        phone: '0920-456-7890',
    },
    {
        id: 'APT-0087',
        name: 'Cynthia Tan',
        service: 'Decorative Film',
        date: 'Apr 6, 2026',
        time: '1:00 PM',
        status: 'confirmed',
        address: 'Kawit, Cavite',
        phone: '0921-567-8901',
    },
];

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

const statusConfig: Record<
    string,
    {
        label: string;
        variant: 'default' | 'secondary' | 'destructive' | 'outline';
        icon: React.ElementType;
        color: string;
    }
> = {
    pending: {
        label: 'Pending',
        variant: 'secondary',
        icon: Clock,
        color: 'text-amber-500',
    },
    confirmed: {
        label: 'Confirmed',
        variant: 'default',
        icon: AlertCircle,
        color: 'text-blue-500',
    },
    completed: {
        label: 'Completed',
        variant: 'outline',
        icon: CheckCircle2,
        color: 'text-emerald-500',
    },
    cancelled: {
        label: 'Cancelled',
        variant: 'destructive',
        icon: XCircle,
        color: 'text-red-500',
    },
};

const avatarColors = [
    'bg-blue-500',
    'bg-emerald-500',
    'bg-violet-500',
    'bg-amber-500',
    'bg-rose-500',
    'bg-cyan-500',
];
const getInitials = (name: string) =>
    name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);

const trendChartConfig = {
    appointments: { label: 'Appointments', color: '#3b82f6' },
    revenue: { label: 'Revenue (₱)', color: '#10b981' },
};

const serviceChartConfig = {
    count: { label: 'Appointments', color: '#6366f1' },
};

const SERVICE_COLORS = ['#3b82f6', '#6366f1', '#10b981', '#f59e0b', '#94a3b8'];

// ─────────────────────────────────────────────────────────────────────────────
// FullCalendar
// ─────────────────────────────────────────────────────────────────────────────

function AppointmentCalendar() {
    const calendarRef = useRef<HTMLDivElement>(null);
    const instanceRef = useRef<any>(null);

    useEffect(() => {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href =
            'https://cdn.jsdelivr.net/npm/fullcalendar@6.1.11/index.global.min.css';
        document.head.appendChild(link);

        const script = document.createElement('script');
        script.src =
            'https://cdn.jsdelivr.net/npm/fullcalendar@6.1.11/index.global.min.js';
        script.onload = () => {
            if (!calendarRef.current || !(window as any).FullCalendar) return;
            const cal = new (window as any).FullCalendar.Calendar(
                calendarRef.current,
                {
                    initialView: 'dayGridMonth',
                    initialDate: '2026-04-01',
                    headerToolbar: {
                        left: 'prev,next today',
                        center: 'title',
                        right: 'dayGridMonth,timeGridWeek,listWeek',
                    },
                    height: 'auto',
                    events: calendarEvents,
                    dayMaxEvents: 3,
                    eventDidMount: (info: any) => {
                        info.el.style.borderRadius = '4px';
                        info.el.style.padding = '1px 5px';
                        info.el.style.fontSize = '11px';
                        info.el.style.fontWeight = '500';
                    },
                },
            );
            cal.render();
            instanceRef.current = cal;
        };
        document.head.appendChild(script);

        return () => {
            instanceRef.current?.destroy();
            if (document.head.contains(link)) document.head.removeChild(link);
            if (document.head.contains(script))
                document.head.removeChild(script);
        };
    }, []);

    return (
        <div
            ref={calendarRef}
            className="[&_.fc-button]:text-xs [&_.fc-button]:capitalize [&_.fc-button-primary]:border-slate-800 [&_.fc-button-primary]:bg-slate-800 [&_.fc-button-primary:hover]:bg-slate-700 [&_.fc-button-primary:not(:disabled).fc-button-active]:bg-slate-900 [&_.fc-col-header-cell]:text-xs [&_.fc-col-header-cell]:font-medium [&_.fc-col-header-cell]:text-slate-500 [&_.fc-day-today]:bg-blue-50 [&_.fc-toolbar-title]:text-base [&_.fc-toolbar-title]:font-semibold"
        />
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Dashboard
// ─────────────────────────────────────────────────────────────────────────────

export default function Index() {
    const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'confirmed'>(
        'all',
    );

    const filtered =
        activeTab === 'all'
            ? recentAppointments
            : recentAppointments.filter((a) => a.status === activeTab);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />

            <div className="space-y-6">
                {/* ── Header ── */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                            Dashboard
                        </h1>
                        <p className="mt-0.5 text-sm text-slate-500">
                            Tuesday, April 7, 2026 — Overview of operations
                        </p>
                    </div>
                    <Button
                        size="sm"
                        className="gap-1.5 bg-slate-900 text-white hover:bg-slate-700"
                    >
                        <CalendarDays className="h-4 w-4" />
                        New Appointment
                    </Button>
                </div>

                {/* ── Stat Cards ── */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    {stats.map((s) => {
                        const Icon = s.icon;
                        return (
                            <Card
                                key={s.label}
                                className="border border-slate-100 shadow-sm transition-shadow hover:shadow-md"
                            >
                                <CardContent className="p-5">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <p className="text-xs font-medium tracking-wide text-slate-500 uppercase">
                                                {s.label}
                                            </p>
                                            <p className="mt-1 text-2xl font-bold text-slate-900">
                                                {s.value}
                                            </p>
                                            <div className="mt-1.5 flex items-center gap-1">
                                                {s.up ? (
                                                    <ArrowUpRight className="h-3.5 w-3.5 text-emerald-500" />
                                                ) : (
                                                    <ArrowDownRight className="h-3.5 w-3.5 text-red-500" />
                                                )}
                                                <span
                                                    className={`text-xs font-semibold ${s.up ? 'text-emerald-600' : 'text-red-500'}`}
                                                >
                                                    {s.change}
                                                </span>
                                                <span className="text-xs text-slate-400">
                                                    vs last month
                                                </span>
                                            </div>
                                        </div>
                                        <div
                                            className={`rounded-lg p-2.5`}
                                        >
                                            <Icon className="h-5 w-5" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>

                {/* ── Status Summary ── */}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {Object.entries(appointmentStatusCounts).map(
                        ([status, count]) => {
                            const cfg = statusConfig[status];
                            const Icon = cfg.icon;
                            return (
                                <div
                                    key={status}
                                    className="flex items-center gap-3 rounded-xl border border-slate-100 bg-white px-4 py-3 shadow-sm"
                                >
                                    <Icon className={`h-4 w-4`} />
                                    <div>
                                        <p className="text-xs text-slate-500 capitalize">
                                            {status}
                                        </p>
                                        <p className="text-lg font-bold text-slate-800">
                                            {count}
                                        </p>
                                    </div>
                                </div>
                            );
                        },
                    )}
                </div>

                {/* ── Charts Row 1: Area + Pie ── */}
                <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
                    {/* Area Chart */}
                    <Card className="border border-slate-100 shadow-sm xl:col-span-2">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base font-semibold text-slate-800">
                                Appointments & Revenue Trend
                            </CardTitle>
                            <CardDescription className="text-xs">
                                Last 7 months performance
                            </CardDescription>
                        </CardHeader>
                        <Separator />
                        <CardContent className="pt-4">
                            <ChartContainer
                                config={trendChartConfig}
                                className="h-56 w-full"
                            >
                                <AreaChart
                                    data={monthlyData}
                                    margin={{
                                        top: 4,
                                        right: 16,
                                        left: 0,
                                        bottom: 0,
                                    }}
                                >
                                    <defs>
                                        <linearGradient
                                            id="gradAppt"
                                            x1="0"
                                            y1="0"
                                            x2="0"
                                            y2="1"
                                        >
                                            <stop
                                                offset="5%"
                                                stopColor="#3b82f6"
                                                stopOpacity={0.25}
                                            />
                                            <stop
                                                offset="95%"
                                                stopColor="#3b82f6"
                                                stopOpacity={0}
                                            />
                                        </linearGradient>
                                        <linearGradient
                                            id="gradRev"
                                            x1="0"
                                            y1="0"
                                            x2="0"
                                            y2="1"
                                        >
                                            <stop
                                                offset="5%"
                                                stopColor="#10b981"
                                                stopOpacity={0.25}
                                            />
                                            <stop
                                                offset="95%"
                                                stopColor="#10b981"
                                                stopOpacity={0}
                                            />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid
                                        strokeDasharray="3 3"
                                        stroke="#f1f5f9"
                                    />
                                    <XAxis
                                        dataKey="month"
                                        tick={{ fontSize: 11, fill: '#94a3b8' }}
                                        axisLine={false}
                                        tickLine={false}
                                    />
                                    <YAxis
                                        yAxisId="left"
                                        tick={{ fontSize: 11, fill: '#94a3b8' }}
                                        axisLine={false}
                                        tickLine={false}
                                    />
                                    <YAxis
                                        yAxisId="right"
                                        orientation="right"
                                        tick={{ fontSize: 11, fill: '#94a3b8' }}
                                        axisLine={false}
                                        tickLine={false}
                                        tickFormatter={(v) =>
                                            `₱${(v / 1000).toFixed(0)}k`
                                        }
                                    />
                                    <ChartTooltip
                                        content={<ChartTooltipContent />}
                                    />
                                    <ChartLegend
                                        content={<ChartLegendContent />}
                                    />
                                    <Area
                                        yAxisId="left"
                                        type="monotone"
                                        dataKey="appointments"
                                        stroke="#3b82f6"
                                        strokeWidth={2}
                                        fill="url(#gradAppt)"
                                        dot={{ r: 3, fill: '#3b82f6' }}
                                    />
                                    <Area
                                        yAxisId="right"
                                        type="monotone"
                                        dataKey="revenue"
                                        stroke="#10b981"
                                        strokeWidth={2}
                                        fill="url(#gradRev)"
                                        dot={{ r: 3, fill: '#10b981' }}
                                    />
                                </AreaChart>
                            </ChartContainer>
                        </CardContent>
                    </Card>

                    {/* Donut / Pie Chart */}
                    <Card className="border border-slate-100 shadow-sm">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base font-semibold text-slate-800">
                                Appointment Status
                            </CardTitle>
                            <CardDescription className="text-xs">
                                Overall breakdown — all time
                            </CardDescription>
                        </CardHeader>
                        <Separator />
                        <CardContent className="flex flex-col items-center pt-4">
                            <ChartContainer
                                config={{
                                    Completed: {
                                        label: 'Completed',
                                        color: '#10b981',
                                    },
                                    Confirmed: {
                                        label: 'Confirmed',
                                        color: '#3b82f6',
                                    },
                                    Pending: {
                                        label: 'Pending',
                                        color: '#f59e0b',
                                    },
                                    Cancelled: {
                                        label: 'Cancelled',
                                        color: '#ef4444',
                                    },
                                }}
                                className="h-48 w-full"
                            >
                                <PieChart>
                                    <Pie
                                        data={statusPieData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={52}
                                        outerRadius={78}
                                        paddingAngle={3}
                                        dataKey="value"
                                    >
                                        {statusPieData.map((entry, i) => (
                                            <Cell
                                                key={i}
                                                fill={entry.fill}
                                                stroke="none"
                                            />
                                        ))}
                                    </Pie>
                                    <ChartTooltip
                                        content={<ChartTooltipContent />}
                                    />
                                </PieChart>
                            </ChartContainer>
                            <div className="mt-2 grid w-full grid-cols-2 gap-x-6 gap-y-1.5 px-2">
                                {statusPieData.map((d) => (
                                    <div
                                        key={d.name}
                                        className="flex items-center gap-1.5"
                                    >
                                        <span
                                            className="h-2.5 w-2.5 shrink-0 rounded-full"
                                            style={{ background: d.fill }}
                                        />
                                        <span className="text-xs text-slate-500">
                                            {d.name}
                                        </span>
                                        <span className="ml-auto text-xs font-semibold text-slate-700">
                                            {d.value}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* ── Bar Chart — Appointments by Service ── */}
                <Card className="border border-slate-100 shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base font-semibold text-slate-800">
                            Appointments by Service Type
                        </CardTitle>
                        <CardDescription className="text-xs">
                            Total volume per service — all time
                        </CardDescription>
                    </CardHeader>
                    <Separator />
                    <CardContent className="pt-4">
                        <ChartContainer
                            config={serviceChartConfig}
                            className="h-52 w-full"
                        >
                            <BarChart
                                data={serviceData}
                                margin={{
                                    top: 4,
                                    right: 12,
                                    left: 0,
                                    bottom: 0,
                                }}
                                barSize={40}
                            >
                                <CartesianGrid
                                    strokeDasharray="3 3"
                                    stroke="#f1f5f9"
                                    vertical={false}
                                />
                                <XAxis
                                    dataKey="service"
                                    tick={{ fontSize: 11, fill: '#94a3b8' }}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <YAxis
                                    tick={{ fontSize: 11, fill: '#94a3b8' }}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <ChartTooltip
                                    content={<ChartTooltipContent />}
                                />
                                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                                    {serviceData.map((_, i) => (
                                        <Cell
                                            key={i}
                                            fill={
                                                SERVICE_COLORS[
                                                    i % SERVICE_COLORS.length
                                                ]
                                            }
                                        />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ChartContainer>
                    </CardContent>
                </Card>

                {/* ── Calendar + Recent Appointments ── */}
                <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
                    {/* FullCalendar */}
                    <Card className="border border-slate-100 shadow-sm xl:col-span-2">
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="text-base font-semibold text-slate-800">
                                        Appointment Calendar
                                    </CardTitle>
                                    <CardDescription className="mt-0.5 text-xs">
                                        Click an event to view details
                                    </CardDescription>
                                </div>
                                <div className="flex items-center gap-3 text-xs text-slate-500">
                                    <span className="flex items-center gap-1">
                                        <span className="inline-block h-2.5 w-2.5 rounded-full bg-blue-500" />{' '}
                                        Confirmed
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <span className="inline-block h-2.5 w-2.5 rounded-full bg-amber-400" />{' '}
                                        Pending
                                    </span>
                                </div>
                            </div>
                        </CardHeader>
                        <Separator />
                        <CardContent className="overflow-x-auto pt-4">
                            <AppointmentCalendar />
                        </CardContent>
                    </Card>

                    {/* Recent Appointments */}
                    <Card className="flex flex-col border border-slate-100 shadow-sm">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base font-semibold text-slate-800">
                                Recent Appointments
                            </CardTitle>
                            <div className="mt-2 flex gap-1">
                                {(['all', 'pending', 'confirmed'] as const).map(
                                    (tab) => (
                                        <button
                                            key={tab}
                                            onClick={() => setActiveTab(tab)}
                                            className={`rounded-md px-2.5 py-1 text-xs font-medium capitalize transition-colors ${
                                                activeTab === tab
                                                    ? 'bg-slate-900 text-white'
                                                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                                            }`}
                                        >
                                            {tab}
                                        </button>
                                    ),
                                )}
                            </div>
                        </CardHeader>
                        <Separator />
                        <CardContent className="max-h-[500px] flex-1 space-y-3 overflow-y-auto pt-3 pr-2">
                            {filtered.map((appt, i) => {
                                const cfg = statusConfig[appt.status];
                                const Icon = cfg.icon;
                                return (
                                    <div
                                        key={appt.id}
                                        className="space-y-2 rounded-xl border border-slate-100 bg-slate-50/60 p-3 transition-all hover:bg-white hover:shadow-sm"
                                    >
                                        <div className="flex items-center gap-2.5">
                                            <Avatar className="h-8 w-8 shrink-0">
                                                <AvatarFallback
                                                    className={`text-xs font-semibold text-white ${avatarColors[i % avatarColors.length]}`}
                                                >
                                                    {getInitials(appt.name)}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="min-w-0 flex-1">
                                                <p className="truncate text-sm font-semibold text-slate-800">
                                                    {appt.name}
                                                </p>
                                                <p className="text-xs text-slate-400">
                                                    {appt.id}
                                                </p>
                                            </div>
                                            <Badge
                                                variant={cfg.variant}
                                                className="h-5 shrink-0 gap-1 px-1.5 py-0 text-[10px]"
                                            >
                                                <Icon className="h-2.5 w-2.5" />
                                                {cfg.label}
                                            </Badge>
                                        </div>
                                        <div className="grid grid-cols-1 gap-1 pl-10 text-xs text-slate-500">
                                            <span className="flex items-center gap-1.5">
                                                <Wrench className="h-3 w-3 shrink-0" />
                                                {appt.service}
                                            </span>
                                            <span className="flex items-center gap-1.5">
                                                <Clock className="h-3 w-3 shrink-0" />
                                                {appt.date} · {appt.time}
                                            </span>
                                            <span className="flex items-center gap-1.5">
                                                <MapPin className="h-3 w-3 shrink-0" />
                                                {appt.address}
                                            </span>
                                            <span className="flex items-center gap-1.5">
                                                <Phone className="h-3 w-3 shrink-0" />
                                                {appt.phone}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </CardContent>
                        <Separator />
                        <div className="p-3">
                            <Button
                                variant="outline"
                                size="sm"
                                className="w-full text-xs text-slate-500"
                            >
                                View All Appointments →
                            </Button>
                        </div>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}
