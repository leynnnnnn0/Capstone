"use client";

import { useMemo, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import listPlugin from "@fullcalendar/list";
import interactionPlugin from "@fullcalendar/interaction";
import type { EventClickArg, EventContentArg } from "@fullcalendar/core";
import Link from "next/link";
import { CalendarDays, Clock, FileText, MapPin, Phone, Users } from "lucide-react";

import AdminAppointmentStatusBadge from "@/components/admin-appointments/AdminAppointmentStatusBadge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type { AdminAppointment } from "@/features/admin-appointments/types";
import { adminStatusMeta, formatAdminDate, formatAdminTime } from "@/features/admin-appointments/admin-appointment-utils";
import { fmtPeso } from "@/features/admin-appointments/admin-quotation-line-utils";

type CalendarMode = "appointments" | "workers";

const workerPalette = [
  { bg: "bg-blue-100", border: "border-blue-500", text: "text-blue-800", dot: "bg-blue-500" },
  { bg: "bg-violet-100", border: "border-violet-500", text: "text-violet-800", dot: "bg-violet-500" },
  { bg: "bg-emerald-100", border: "border-emerald-500", text: "text-emerald-800", dot: "bg-emerald-500" },
  { bg: "bg-amber-100", border: "border-amber-500", text: "text-amber-800", dot: "bg-amber-500" },
  { bg: "bg-rose-100", border: "border-rose-500", text: "text-rose-800", dot: "bg-rose-500" },
  { bg: "bg-cyan-100", border: "border-cyan-500", text: "text-cyan-800", dot: "bg-cyan-500" },
];

const statusColors: Record<string, { bg: string; border: string; text: string; dot: string }> = {
  pending: { bg: "bg-amber-50", border: "border-amber-500", text: "text-amber-800", dot: "bg-amber-500" },
  confirmed: { bg: "bg-blue-50", border: "border-blue-500", text: "text-blue-800", dot: "bg-blue-500" },
  rescheduled: { bg: "bg-sky-50", border: "border-sky-500", text: "text-sky-800", dot: "bg-sky-500" },
  on_the_way: { bg: "bg-indigo-50", border: "border-indigo-500", text: "text-indigo-800", dot: "bg-indigo-500" },
  in_progress: { bg: "bg-violet-50", border: "border-violet-500", text: "text-violet-800", dot: "bg-violet-500" },
  completed: { bg: "bg-emerald-50", border: "border-emerald-500", text: "text-emerald-800", dot: "bg-emerald-500" },
  cancelled: { bg: "bg-red-50", border: "border-red-500", text: "text-red-800", dot: "bg-red-500" },
  reopened: { bg: "bg-sky-50", border: "border-sky-500", text: "text-sky-800", dot: "bg-sky-500" },
  no_show: { bg: "bg-red-50", border: "border-red-500", text: "text-red-800", dot: "bg-red-500" },
};

const fcClasses = `[&_.fc]:font-sans [&_.fc-button]:rounded-md [&_.fc-button]:border [&_.fc-button]:border-border [&_.fc-button]:bg-background [&_.fc-button]:px-3 [&_.fc-button]:py-1.5 [&_.fc-button]:text-xs [&_.fc-button]:font-medium [&_.fc-button]:text-foreground [&_.fc-button]:shadow-none [&_.fc-button-active]:!border-primary [&_.fc-button-active]:!bg-primary [&_.fc-button-active]:!text-primary-foreground [&_.fc-button-primary]:!border-border [&_.fc-button-primary]:!bg-background [&_.fc-button-primary]:!text-foreground [&_.fc-button-primary.fc-button-active]:!bg-primary [&_.fc-button-primary.fc-button-active]:!text-primary-foreground [&_.fc-button-primary:hover]:!bg-muted [&_.fc-col-header-cell]:py-2 [&_.fc-col-header-cell-cushion]:text-xs [&_.fc-col-header-cell-cushion]:font-semibold [&_.fc-col-header-cell-cushion]:tracking-widest [&_.fc-col-header-cell-cushion]:text-muted-foreground [&_.fc-col-header-cell-cushion]:uppercase [&_.fc-col-header-cell-cushion]:no-underline [&_.fc-day-today]:!bg-primary/5 [&_.fc-daygrid-day-number]:text-xs [&_.fc-daygrid-day-number]:font-semibold [&_.fc-daygrid-day-number]:text-foreground [&_.fc-daygrid-day-number]:no-underline [&_.fc-event]:cursor-pointer [&_.fc-event]:border-none [&_.fc-event]:bg-transparent [&_.fc-event]:shadow-none [&_.fc-scrollgrid]:border-border [&_.fc-scrollgrid-section>td]:border-border [&_.fc-timegrid-slot]:border-border [&_.fc-timegrid-slot-label-cushion]:text-xs [&_.fc-timegrid-slot-label-cushion]:text-muted-foreground [&_.fc-toolbar-title]:text-xl [&_.fc-toolbar-title]:font-semibold [&_.fc-toolbar-title]:text-foreground [&_td.fc-day]:border-border [&_th.fc-day]:border-border`;

export default function AdminAppointmentCalendar({ appointments }: { appointments: AdminAppointment[] }) {
  const [mode, setMode] = useState<CalendarMode>("appointments");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const scheduled = appointments.filter((appointment) => appointment.appointment_date && appointment.appointment_time_from && appointment.appointment_time_until);
  const initialDate = scheduled[0]?.appointment_date ?? new Date().toISOString().slice(0, 10);
  const appointmentEvents = useMemo(() => toAppointmentEvents(scheduled), [scheduled]);
  const workerEvents = useMemo(() => toWorkerEvents(scheduled), [scheduled]);
  const slotRange = useMemo(() => calendarSlotRange(scheduled), [scheduled]);
  const selectedAppointment = appointments.find((appointment) => appointment.id === selectedId) ?? null;
  const calendarMinWidth = mode === "workers"
    ? Math.max(1040, 7 * Math.max(maxConcurrentWorkerEvents(scheduled), 1) * 150)
    : 1040;

  function handleEventClick(info: EventClickArg) {
    const appointmentIds = info.event.extendedProps.appointment_ids as number[] | undefined;
    const appointmentId = appointmentIds?.[0] ?? Number(info.event.extendedProps.appointment_id ?? info.event.id);

    if (appointmentId) setSelectedId(appointmentId);
  }

  return (
    <>
    <div className="flex h-full flex-col gap-4">
      <div className="flex items-center gap-2">
        <div className="inline-flex gap-1 rounded-lg border bg-muted p-1">
          <button type="button" onClick={() => setMode("appointments")} className={`rounded-md px-3 py-1.5 text-sm font-semibold transition-all ${mode === "appointments" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
            📋 Appointments
          </button>
          <button type="button" onClick={() => setMode("workers")} className={`rounded-md px-3 py-1.5 text-sm font-semibold transition-all ${mode === "workers" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
            👷 Workers Schedule
          </button>
        </div>
      </div>

      <div className={`flex-1 overflow-auto rounded-xl border bg-card p-3 shadow-sm ${fcClasses}`}>
        <style>{`.fc .fc-timegrid-slot { height: 2.25rem !important; } .fc .fc-toolbar.fc-header-toolbar { margin-bottom: 1rem; } .fc .fc-daygrid-day-events { min-height: 1.5rem; } .fc .fc-timegrid-event-harness { inset-inline-end: 0 !important; } .fc .fc-timegrid-event { margin-inline-end: 0 !important; }`}</style>
        <div style={{ minWidth: calendarMinWidth }}>
          <FullCalendar
            key={mode}
            plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
            initialView="timeGridWeek"
            initialDate={initialDate}
            headerToolbar={{
              left: "prev,next today",
              center: "title",
              right: "dayGridMonth,timeGridWeek,timeGridDay,listWeek",
            }}
            buttonText={{ today: "Today", month: "Month", week: "Week", day: "Day", list: "List" }}
            events={mode === "appointments" ? appointmentEvents : workerEvents}
            eventContent={(info) => mode === "appointments" ? <AppointmentEventBlock info={info} onSelect={setSelectedId} /> : <WorkerEventBlock info={info} />}
            eventClick={handleEventClick}
            slotMinTime={slotRange.min}
            slotMaxTime={slotRange.max}
            slotDuration="01:00:00"
            eventMinHeight={24}
            eventShortHeight={20}
            height="auto"
            nowIndicator
            allDaySlot={false}
            dayMaxEvents={false}
            slotEventOverlap={mode === "workers" ? false : true}
            expandRows={false}
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
        {mode === "appointments"
          ? ["pending", "confirmed", "completed", "cancelled"].map((status) => (
              <div key={status} className="flex items-center gap-1.5">
                <span className={`size-2.5 rounded-full ${statusColors[status].dot}`} />
                <span>{adminStatusMeta[status as keyof typeof adminStatusMeta]?.label ?? status}</span>
              </div>
            ))
          : uniqueWorkers(scheduled).map((worker, index) => {
              const color = workerPalette[index % workerPalette.length];
              return (
                <div key={worker} className="flex items-center gap-1.5">
                  <span className={`size-2.5 rounded-full ${color.dot}`} />
                  <span>{worker}</span>
                </div>
              );
            })}
      </div>
    </div>
    <CalendarDetailsDrawer appointment={selectedAppointment} open={Boolean(selectedAppointment)} onOpenChange={(open) => !open && setSelectedId(null)} />
    </>
  );
}

function toAppointmentEvents(appointments: AdminAppointment[]) {
  return overlappingAppointmentGroups(appointments).map((group) => {
    const first = group[0];
    const start = minTime(group.map((appointment) => appointment.appointment_time_from));
    const end = maxTime(group.map((appointment) => appointment.appointment_time_until));

    return {
      id: group.map((appointment) => appointment.id).join("-"),
      title: group.length === 1 ? first.appointment_number : `${group.length} appointments`,
      start: `${first.appointment_date}T${start}`,
      end: `${first.appointment_date}T${end}`,
      extendedProps: {
        appointment_id: first.id,
        appointment_ids: group.map((appointment) => appointment.id),
        appointments: group,
        full_name: first.full_name,
        status: first.status,
        time_from: start,
        time_until: end,
      },
      backgroundColor: "transparent",
      borderColor: "transparent",
    };
  });
}

function toWorkerEvents(appointments: AdminAppointment[]) {
  return appointments.flatMap((appointment) =>
    appointment.workers.map((worker, index) => {
      const color = workerPalette[index % workerPalette.length];
      return {
        id: `w${worker.id}-a${appointment.id}`,
        title: appointment.appointment_number,
        start: `${appointment.appointment_date}T${appointment.appointment_time_from}`,
        end: `${appointment.appointment_date}T${appointment.appointment_time_until}`,
        extendedProps: {
          appointment_id: appointment.id,
          full_name: appointment.full_name,
          status: appointment.status,
          worker_name: worker.full_name,
          time_from: appointment.appointment_time_from,
          time_until: appointment.appointment_time_until,
          workerColor: color,
        },
        backgroundColor: "transparent",
        borderColor: "transparent",
      };
    }),
  );
}

function CalendarDetailsDrawer({
  appointment,
  open,
  onOpenChange,
}: {
  appointment: AdminAppointment | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const quoteTotal = appointment?.quotation?.items
    .filter((item) => item.status === "approved")
    .reduce((sum, item) => sum + Number(item.total_amount || 0), 0) ?? 0;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-md p-3">
        {appointment && (
          <>
            <SheetHeader className="text-left">
              <SheetTitle className="text-base">{appointment.appointment_number}</SheetTitle>
              <SheetDescription>{appointment.full_name}</SheetDescription>
            </SheetHeader>

            <div className="mt-6 space-y-5">
              <div className="flex items-center justify-between gap-3">
                <AdminAppointmentStatusBadge status={appointment.status} />
                <Button asChild size="sm">
                  <Link href={`/dashboard/appointments/${appointment.id}`}>View Appointment</Link>
                </Button>
              </div>

              <div className="space-y-3 rounded-lg border p-4 text-sm">
                <Detail icon={CalendarDays} label="Date" value={formatAdminDate(appointment.appointment_date)} />
                <Detail
                  icon={Clock}
                  label="Time"
                  value={`${formatAdminTime(appointment.appointment_time_from)} - ${formatAdminTime(appointment.appointment_time_until)}`}
                />
                <Detail icon={Phone} label="Phone" value={appointment.phone_number} />
                <Detail icon={MapPin} label="Address" value={appointment.address} />
              </div>

              <div className="space-y-3 rounded-lg border p-4">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-primary">
                  <Users className="size-4" />
                  Assigned Workers
                </div>
                {appointment.workers.length ? (
                  <div className="flex flex-wrap gap-2">
                    {appointment.workers.map((worker) => (
                      <span key={worker.id} className="rounded-full bg-muted px-3 py-1 text-xs">{worker.full_name}</span>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No workers assigned yet.</p>
                )}
              </div>

              <div className="rounded-lg border p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-primary">
                    <FileText className="size-4" />
                    Quotation
                  </div>
                  <span className="text-sm font-semibold">₱{fmtPeso(quoteTotal)}</span>
                </div>
                <Separator className="my-3" />
                <p className="text-sm text-muted-foreground">
                  {appointment.quotation?.items.length
                    ? `${appointment.quotation.items.length} item${appointment.quotation.items.length === 1 ? "" : "s"} attached`
                    : "No quotation attached."}
                </p>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

function Detail({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof CalendarDays;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="mt-0.5 size-4 text-primary" />
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="mt-0.5 text-sm">{value || "-"}</p>
      </div>
    </div>
  );
}

function AppointmentEventBlock({ info, onSelect }: { info: EventContentArg; onSelect: (id: number) => void }) {
  const props = info.event.extendedProps as {
    appointments?: AdminAppointment[];
    status: string;
    full_name: string;
    time_from: string;
    time_until: string;
  };
  const group = props.appointments ?? [];
  const color = statusColors[props.status] ?? statusColors.pending;
  const isMonthView = info.view.type === "dayGridMonth";

  if (isMonthView) {
    if (group.length > 1) {
      return (
        <div className="space-y-0.5">
          {group.map((appointment) => {
            const itemColor = statusColors[appointment.status] ?? statusColors.pending;

            return (
              <button
                key={appointment.id}
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  onSelect(appointment.id);
                }}
                className={`flex w-full items-center gap-1.5 overflow-hidden rounded px-1.5 py-0.5 text-left ${itemColor.bg} ${itemColor.text}`}
              >
                <span className={`size-1.5 shrink-0 rounded-full ${itemColor.dot}`} />
                <span className="truncate text-[11px] font-semibold">{appointment.appointment_number}</span>
              </button>
            );
          })}
        </div>
      );
    }

    return (
      <div className={`flex w-full items-center gap-1.5 overflow-hidden rounded px-1.5 py-0.5 ${color.bg} ${color.text}`}>
        <span className={`size-1.5 shrink-0 rounded-full ${color.dot}`} />
        <span className="truncate text-[11px] font-semibold">{info.event.title}</span>
      </div>
    );
  }

  if (group.length > 1) {
    return (
      <div className="flex h-full w-full flex-col gap-1 overflow-y-auto rounded-lg border bg-background/80 p-1.5">
        {group.map((appointment) => {
          const itemColor = statusColors[appointment.status] ?? statusColors.pending;

          return (
            <button
              key={appointment.id}
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onSelect(appointment.id);
              }}
              className={`min-h-8 rounded-md border-l-4 px-1.5 py-1 text-left ${itemColor.bg} ${itemColor.border} ${itemColor.text}`}
            >
              <p className="truncate text-[11px] font-bold leading-tight">{appointment.appointment_number}</p>
              <p className="truncate text-[10px] leading-tight opacity-80">{appointment.full_name}</p>
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className={`flex h-full w-full flex-col overflow-hidden rounded-md border-l-4 px-1.5 py-1 ${color.bg} ${color.border} ${color.text}`}>
      <p className="truncate text-[11px] font-bold leading-tight">{info.event.title}</p>
      <p className="truncate text-[10px] leading-tight opacity-80">{props.full_name}</p>
      <p className="text-[10px] leading-tight opacity-70">{formatAdminTime(props.time_from)} - {formatAdminTime(props.time_until)}</p>
    </div>
  );
}

function WorkerEventBlock({ info }: { info: EventContentArg }) {
  const props = info.event.extendedProps as { full_name: string; worker_name: string; time_from: string; time_until: string; workerColor: typeof workerPalette[number] };
  const color = props.workerColor;

  return (
    <div className={`flex h-full w-full flex-col overflow-hidden rounded-md border-l-4 px-1.5 py-1 ${color.bg} ${color.border} ${color.text}`}>
      <p className="truncate text-[11px] font-bold leading-tight">{info.event.title}</p>
      <p className="truncate text-[10px] font-semibold leading-tight opacity-90">{props.worker_name}</p>
      <p className="truncate text-[10px] leading-tight opacity-70">{props.full_name}</p>
      <p className="text-[10px] leading-tight opacity-60">{formatAdminTime(props.time_from)} - {formatAdminTime(props.time_until)}</p>
    </div>
  );
}

function uniqueWorkers(appointments: AdminAppointment[]) {
  return Array.from(new Set(appointments.flatMap((appointment) => appointment.workers.map((worker) => worker.full_name))));
}

function overlappingAppointmentGroups(appointments: AdminAppointment[]) {
  const byDate = new Map<string, AdminAppointment[]>();

  appointments.forEach((appointment) => {
    const date = String(appointment.appointment_date);
    byDate.set(date, [...(byDate.get(date) ?? []), appointment]);
  });

  return Array.from(byDate.values()).flatMap((items) => {
    const sorted = [...items].sort((a, b) => minutes(a.appointment_time_from) - minutes(b.appointment_time_from));
    const groups: AdminAppointment[][] = [];

    sorted.forEach((appointment) => {
      const start = minutes(appointment.appointment_time_from);
      const current = groups.at(-1);

      if (!current) {
        groups.push([appointment]);
        return;
      }

      const currentEnd = Math.max(...current.map((item) => minutes(item.appointment_time_until)));

      if (start < currentEnd) {
        current.push(appointment);
        return;
      }

      groups.push([appointment]);
    });

    return groups;
  });
}

function minutes(value?: string | null) {
  const [hour = "0", minute = "0"] = String(value ?? "00:00").split(":");
  return Number(hour) * 60 + Number(minute);
}

function minTime(values: Array<string | null | undefined>) {
  return values.reduce((min, value) => minutes(value) < minutes(min) ? value : min, values[0]) ?? "00:00";
}

function maxTime(values: Array<string | null | undefined>) {
  return values.reduce((max, value) => minutes(value) > minutes(max) ? value : max, values[0]) ?? "00:00";
}

function calendarSlotRange(appointments: AdminAppointment[]) {
  if (!appointments.length) {
    return { min: "08:00:00", max: "18:00:00" };
  }

  const starts = appointments.map((appointment) => minutes(appointment.appointment_time_from));
  const ends = appointments.map((appointment) => minutes(appointment.appointment_time_until));
  const minHour = Math.max(0, Math.floor(Math.min(...starts) / 60) - 1);
  const maxHour = Math.min(24, Math.ceil(Math.max(...ends) / 60) + 1);

  return {
    min: slotTime(minHour),
    max: slotTime(Math.max(maxHour, minHour + 2)),
  };
}

function slotTime(hour: number) {
  return `${String(hour).padStart(2, "0")}:00:00`;
}

function maxConcurrentWorkerEvents(appointments: AdminAppointment[]) {
  const grouped = new Map<string, number>();

  appointments.forEach((appointment) => {
    const key = [
      appointment.appointment_date,
      appointment.appointment_time_from,
      appointment.appointment_time_until,
    ].join("|");
    grouped.set(key, (grouped.get(key) ?? 0) + appointment.workers.length);
  });

  return Math.max(1, ...grouped.values());
}
