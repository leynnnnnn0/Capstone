import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import interactionPlugin from '@fullcalendar/interaction';
import type { EventContentArg } from '@fullcalendar/core';
import { STATUS_COLORS } from '@/constants/statusColor';
import { useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Calendar', href: '/calendar' },
];

interface Appointment {
    id: number;
    appointment_number: string;
    full_name: string;
    date: string;
    time_from: string;
    time_until: string;
    status:
        | 'pending'
        | 'confirmed'
        | 'cancelled'
        | 'completed'
        | 'on_the_way'
        | 'on_going';
}

interface Worker {
    id: number;
    full_name: string;
    appointments: Appointment[];
}

// Distinct colors for up to ~12 workers, cycling if more
const WORKER_PALETTE = [
    {
        bg: 'bg-blue-100',
        border: 'border-blue-500',
        text: 'text-blue-800',
        dot: 'bg-blue-500',
    },
    {
        bg: 'bg-violet-100',
        border: 'border-violet-500',
        text: 'text-violet-800',
        dot: 'bg-violet-500',
    },
    {
        bg: 'bg-emerald-100',
        border: 'border-emerald-500',
        text: 'text-emerald-800',
        dot: 'bg-emerald-500',
    },
    {
        bg: 'bg-amber-100',
        border: 'border-amber-500',
        text: 'text-amber-800',
        dot: 'bg-amber-500',
    },
    {
        bg: 'bg-rose-100',
        border: 'border-rose-500',
        text: 'text-rose-800',
        dot: 'bg-rose-500',
    },
    {
        bg: 'bg-cyan-100',
        border: 'border-cyan-500',
        text: 'text-cyan-800',
        dot: 'bg-cyan-500',
    },
    {
        bg: 'bg-fuchsia-100',
        border: 'border-fuchsia-500',
        text: 'text-fuchsia-800',
        dot: 'bg-fuchsia-500',
    },
    {
        bg: 'bg-lime-100',
        border: 'border-lime-500',
        text: 'text-lime-800',
        dot: 'bg-lime-500',
    },
    {
        bg: 'bg-orange-100',
        border: 'border-orange-500',
        text: 'text-orange-800',
        dot: 'bg-orange-500',
    },
    {
        bg: 'bg-teal-100',
        border: 'border-teal-500',
        text: 'text-teal-800',
        dot: 'bg-teal-500',
    },
    {
        bg: 'bg-indigo-100',
        border: 'border-indigo-500',
        text: 'text-indigo-800',
        dot: 'bg-indigo-500',
    },
    {
        bg: 'bg-pink-100',
        border: 'border-pink-500',
        text: 'text-pink-800',
        dot: 'bg-pink-500',
    },
];

function toAppointmentEvents(appointments: Appointment[]) {
    return appointments.map((a) => ({
        id: String(a.id),
        title: a.appointment_number,
        start: `${a.date}T${a.time_from}`,
        end: `${a.date}T${a.time_until}`,
        extendedProps: {
            full_name: a.full_name,
            status: a.status,
            time_from: a.time_from,
            time_until: a.time_until,
        },
        backgroundColor: 'transparent',
        borderColor: 'transparent',
    }));
}

function toWorkerEvents(workers: Worker[]) {
    return workers.flatMap((worker, idx) => {
        const colors = WORKER_PALETTE[idx % WORKER_PALETTE.length];
        return worker.appointments.map((a) => ({
            id: `w${worker.id}-a${a.id}`,
            title: a.appointment_number,
            start: `${a.date}T${a.time_from}`,
            end: `${a.date}T${a.time_until}`,
            extendedProps: {
                full_name: a.full_name,
                status: a.status,
                time_from: a.time_from,
                time_until: a.time_until,
                worker_name: worker.full_name,
                workerColors: colors,
            },
            backgroundColor: 'transparent',
            borderColor: 'transparent',
        }));
    });
}

function formatTime(t: string) {
    const [h, m] = t.split(':').map(Number);
    const suffix = h < 12 ? 'AM' : 'PM';
    const hour = h % 12 || 12;
    return `${hour}${m > 0 ? `:${String(m).padStart(2, '0')}` : ''} ${suffix}`;
}

function AppointmentEventBlock({ info }: { info: EventContentArg }) {
    const { status, full_name, time_from, time_until } = info.event
        .extendedProps as {
        status: string;
        full_name: string;
        time_from: string;
        time_until: string;
    };
    const colors = STATUS_COLORS[status] ?? STATUS_COLORS.pending;
    const isMonthView = info.view.type === 'dayGridMonth';
    const isListView = info.view.type === 'listWeek';

    if (isMonthView) {
        return (
            <div
                className={`flex items-center gap-1.5 rounded px-1.5 py-0.5 ${colors.bg} ${colors.text} w-full overflow-hidden`}
            >
                <span
                    className={`h-1.5 w-1.5 shrink-0 rounded-full ${colors.dot}`}
                />
                <span className="truncate text-[11px] font-semibold">
                    {info.event.title}
                </span>
            </div>
        );
    }
    if (isListView) {
        return (
            <div className={`flex items-center gap-2 ${colors.text}`}>
                <span
                    className={`h-2 w-2 shrink-0 rounded-full ${colors.dot}`}
                />
                <span className="text-xs font-semibold">
                    {info.event.title}
                </span>
                <span className="text-xs opacity-70">· {full_name}</span>
            </div>
        );
    }
    return (
        <div
            className={`flex h-full w-full flex-col overflow-hidden rounded-lg border-l-4 px-2 py-1 ${colors.bg} ${colors.border} ${colors.text}`}
        >
            <p className="truncate text-[11px] leading-tight font-bold">
                {info.event.title}
            </p>
            <p className="truncate text-[10px] leading-tight opacity-80">
                {full_name}
            </p>
            <p className="text-[10px] leading-tight opacity-70">
                {formatTime(time_from)} – {formatTime(time_until)}
            </p>
        </div>
    );
}

function WorkerEventBlock({ info }: { info: EventContentArg }) {
    const { full_name, time_from, time_until, worker_name, workerColors } = info
        .event.extendedProps as {
        full_name: string;
        time_from: string;
        time_until: string;
        worker_name: string;
        workerColors: { bg: string; border: string; text: string; dot: string };
    };
    const colors = workerColors;
    const isMonthView = info.view.type === 'dayGridMonth';
    const isListView = info.view.type === 'listWeek';

    if (isMonthView) {
        return (
            <div
                className={`flex items-center gap-1.5 rounded px-1.5 py-0.5 ${colors.bg} ${colors.text} w-full overflow-hidden`}
            >
                <span
                    className={`h-1.5 w-1.5 shrink-0 rounded-full ${colors.dot}`}
                />
                <span className="truncate text-[11px] font-semibold">
                    {info.event.title}
                </span>
            </div>
        );
    }
    if (isListView) {
        return (
            <div className={`flex items-center gap-2 ${colors.text}`}>
                <span
                    className={`h-2 w-2 shrink-0 rounded-full ${colors.dot}`}
                />
                <span className="text-xs font-semibold">
                    {info.event.title}
                </span>
                <span className="text-xs opacity-70">· {worker_name}</span>
            </div>
        );
    }
    return (
        <div
            className={`flex h-full w-full flex-col overflow-hidden rounded-lg border-l-4 px-2 py-1 ${colors.bg} ${colors.border} ${colors.text}`}
        >
            <p className="truncate text-[11px] leading-tight font-bold">
                {info.event.title}
            </p>
            <p className="truncate text-[10px] leading-tight font-semibold opacity-90">
                {worker_name}
            </p>
            <p className="truncate text-[10px] leading-tight opacity-70">
                {full_name}
            </p>
            <p className="text-[10px] leading-tight opacity-60">
                {formatTime(time_from)} – {formatTime(time_until)}
            </p>
        </div>
    );
}

const FC_CLASSES = `[&_.fc]:font-sans [&_.fc-button]:rounded-lg [&_.fc-button]:border [&_.fc-button]:border-border [&_.fc-button]:bg-background [&_.fc-button]:px-3 [&_.fc-button]:py-1.5 [&_.fc-button]:text-xs [&_.fc-button]:font-semibold [&_.fc-button]:text-foreground [&_.fc-button]:shadow-none [&_.fc-button]:transition-all [&_.fc-button-active]:!border-primary [&_.fc-button-active]:!bg-primary [&_.fc-button-active]:!text-primary-foreground [&_.fc-button-primary]:!border-border [&_.fc-button-primary]:!bg-background [&_.fc-button-primary]:!text-foreground [&_.fc-button-primary.fc-button-active]:!bg-primary [&_.fc-button-primary.fc-button-active]:!text-primary-foreground [&_.fc-button-primary:hover]:!bg-muted [&_.fc-button:hover]:bg-muted [&_.fc-col-header-cell]:py-2 [&_.fc-col-header-cell-cushion]:text-xs [&_.fc-col-header-cell-cushion]:font-semibold [&_.fc-col-header-cell-cushion]:tracking-widest [&_.fc-col-header-cell-cushion]:text-muted-foreground [&_.fc-col-header-cell-cushion]:uppercase [&_.fc-col-header-cell-cushion]:no-underline [&_.fc-day-today]:!bg-primary/5 [&_.fc-daygrid-day-number]:text-sm [&_.fc-daygrid-day-number]:font-semibold [&_.fc-daygrid-day-number]:text-foreground [&_.fc-daygrid-day-number]:no-underline [&_.fc-daygrid-event]:rounded [&_.fc-event]:cursor-pointer [&_.fc-event]:border-none [&_.fc-event]:bg-transparent [&_.fc-event]:shadow-none [&_.fc-event:focus]:shadow-none [&_.fc-event:focus-within]:shadow-none [&_.fc-highlight]:bg-primary/10 [&_.fc-list-day-cushion]:bg-muted [&_.fc-list-day-side-text]:text-sm [&_.fc-list-day-side-text]:text-muted-foreground [&_.fc-list-day-side-text]:no-underline [&_.fc-list-day-text]:text-sm [&_.fc-list-day-text]:font-semibold [&_.fc-list-day-text]:text-foreground [&_.fc-list-day-text]:no-underline [&_.fc-list-event-time]:text-xs [&_.fc-list-event-time]:text-muted-foreground [&_.fc-scrollgrid]:border-border [&_.fc-scrollgrid-section>td]:border-border [&_.fc-timegrid-slot]:h-20 [&_.fc-timegrid-slot]:border-border [&_.fc-timegrid-slot-label-cushion]:text-[11px] [&_.fc-timegrid-slot-label-cushion]:text-muted-foreground [&_.fc-toolbar-title]:text-base [&_.fc-toolbar-title]:font-bold [&_.fc-toolbar-title]:text-foreground [&_td.fc-day]:border-border [&_th.fc-day]:border-border`;

type CalendarMode = 'appointments' | 'workers';

export default function Calendar({
    appointments,
    workers,
}: {
    appointments: Appointment[];
    workers: Worker[];
}) {
    const [mode, setMode] = useState<CalendarMode>('appointments');

    const appointmentEvents = toAppointmentEvents(appointments);
    const workerEvents = toWorkerEvents(workers);

    return (
        <div className="flex h-full flex-col gap-4">
            {/* ── Mode Toggle ── */}
            <div className="flex items-center gap-2">
                <div className="inline-flex gap-1 rounded-lg border border-border bg-muted p-1">
                    <button
                        onClick={() => setMode('appointments')}
                        className={`rounded-md px-4 py-1.5 text-sm font-semibold transition-all ${
                            mode === 'appointments'
                                ? 'bg-background text-foreground shadow-sm'
                                : 'text-muted-foreground hover:text-foreground'
                        }`}
                    >
                        📋 Appointments
                    </button>
                    <button
                        onClick={() => setMode('workers')}
                        className={`rounded-md px-4 py-1.5 text-sm font-semibold transition-all ${
                            mode === 'workers'
                                ? 'bg-background text-foreground shadow-sm'
                                : 'text-muted-foreground hover:text-foreground'
                        }`}
                    >
                        👷 Workers Schedule
                    </button>
                </div>
            
            </div>

            {/* ── Calendar ── */}
            <div
                className={`flex-1 overflow-auto rounded-2xl border border-border bg-card p-4 shadow-sm ${FC_CLASSES}`}
            >
                <style>{`.fc .fc-timegrid-slot { height: 2.5rem !important; }`}</style>

                {mode === 'appointments' ? (
                    <FullCalendar
                        key="appointments"
                        plugins={[
                            dayGridPlugin,
                            timeGridPlugin,
                            listPlugin,
                            interactionPlugin,
                        ]}
                        initialView="timeGridWeek"
                        initialDate="2026-03-29"
                        headerToolbar={{
                            left: 'prev,next today',
                            center: 'title',
                            right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek',
                        }}
                        buttonText={{
                            today: 'Today',
                            month: 'Month',
                            week: 'Week',
                            day: 'Day',
                            list: 'List',
                        }}
                        events={appointmentEvents}
                        eventContent={(info) => (
                            <AppointmentEventBlock info={info} />
                        )}
                        slotMinTime="06:00:00"
                        slotMaxTime="20:00:00"
                        slotDuration="01:00:00"
                        height="auto"
                        nowIndicator
                        allDaySlot={false}
                        dayMaxEvents={3}
                        eventMaxStack={3}
                    />
                ) : (
                    <FullCalendar
                        key="workers"
                        plugins={[
                            dayGridPlugin,
                            timeGridPlugin,
                            listPlugin,
                            interactionPlugin,
                        ]}
                        initialView="timeGridWeek"
                        initialDate="2026-03-29"
                        headerToolbar={{
                            left: 'prev,next today',
                            center: 'title',
                            right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek',
                        }}
                        buttonText={{
                            today: 'Today',
                            month: 'Month',
                            week: 'Week',
                            day: 'Day',
                            list: 'List',
                        }}
                        events={workerEvents}
                        eventContent={(info) => (
                            <WorkerEventBlock info={info} />
                        )}
                        slotMinTime="06:00:00"
                        slotMaxTime="20:00:00"
                        slotDuration="01:00:00"
                        height="auto"
                        nowIndicator
                        allDaySlot={false}
                        dayMaxEvents={3}
                        eventMaxStack={3}
                    />
                )}
            </div>

            {/* ── Legend ── */}
            {mode === 'appointments' ? (
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    {(
                        [
                            'pending',
                            'confirmed',
                            'completed',
                            'cancelled',
                        ] as const
                    ).map((s) => (
                        <div key={s} className="flex items-center gap-1.5">
                            <span
                                className={`inline-block h-2.5 w-2.5 rounded-sm ${STATUS_COLORS[s].dot}`}
                            />
                            <span className="capitalize">{s}</span>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    {workers.map((w, idx) => {
                        const colors =
                            WORKER_PALETTE[idx % WORKER_PALETTE.length];
                        return (
                            <div
                                key={w.id}
                                className="flex items-center gap-1.5"
                            >
                                <span
                                    className={`inline-block h-2.5 w-2.5 rounded-sm ${colors.dot}`}
                                />
                                <span>{w.full_name}</span>
                                <span className="opacity-60">
                                    ({w.appointments.length})
                                </span>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
