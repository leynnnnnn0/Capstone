"use client";

import { useMemo, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import listPlugin from "@fullcalendar/list";
import interactionPlugin from "@fullcalendar/interaction";
import type { EventContentArg } from "@fullcalendar/core";

import type { AdminAppointment } from "@/features/admin-appointments/types";
import { adminStatusMeta, formatAdminTime } from "@/features/admin-appointments/admin-appointment-utils";

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
  no_show: { bg: "bg-red-50", border: "border-red-500", text: "text-red-800", dot: "bg-red-500" },
};

const fcClasses = `[&_.fc]:font-sans [&_.fc-button]:rounded-lg [&_.fc-button]:border [&_.fc-button]:border-border [&_.fc-button]:bg-background [&_.fc-button]:px-4 [&_.fc-button]:py-2 [&_.fc-button]:text-sm [&_.fc-button]:font-semibold [&_.fc-button]:text-foreground [&_.fc-button]:shadow-none [&_.fc-button-active]:!border-primary [&_.fc-button-active]:!bg-primary [&_.fc-button-active]:!text-primary-foreground [&_.fc-button-primary]:!border-border [&_.fc-button-primary]:!bg-background [&_.fc-button-primary]:!text-foreground [&_.fc-button-primary.fc-button-active]:!bg-primary [&_.fc-button-primary.fc-button-active]:!text-primary-foreground [&_.fc-button-primary:hover]:!bg-muted [&_.fc-col-header-cell]:py-3 [&_.fc-col-header-cell-cushion]:text-sm [&_.fc-col-header-cell-cushion]:font-semibold [&_.fc-col-header-cell-cushion]:tracking-widest [&_.fc-col-header-cell-cushion]:text-muted-foreground [&_.fc-col-header-cell-cushion]:uppercase [&_.fc-col-header-cell-cushion]:no-underline [&_.fc-day-today]:!bg-primary/5 [&_.fc-daygrid-day-number]:text-sm [&_.fc-daygrid-day-number]:font-semibold [&_.fc-daygrid-day-number]:text-foreground [&_.fc-daygrid-day-number]:no-underline [&_.fc-event]:cursor-pointer [&_.fc-event]:border-none [&_.fc-event]:bg-transparent [&_.fc-event]:shadow-none [&_.fc-scrollgrid]:border-border [&_.fc-scrollgrid-section>td]:border-border [&_.fc-timegrid-slot]:border-border [&_.fc-timegrid-slot-label-cushion]:text-sm [&_.fc-timegrid-slot-label-cushion]:text-muted-foreground [&_.fc-toolbar-title]:text-3xl [&_.fc-toolbar-title]:font-black [&_.fc-toolbar-title]:text-foreground [&_td.fc-day]:border-border [&_th.fc-day]:border-border`;

export default function AdminAppointmentCalendar({ appointments }: { appointments: AdminAppointment[] }) {
  const [mode, setMode] = useState<CalendarMode>("appointments");
  const scheduled = appointments.filter((appointment) => appointment.appointment_date && appointment.appointment_time_from && appointment.appointment_time_until);
  const initialDate = scheduled[0]?.appointment_date ?? new Date().toISOString().slice(0, 10);
  const appointmentEvents = useMemo(() => scheduled.map(toAppointmentEvent), [scheduled]);
  const workerEvents = useMemo(() => toWorkerEvents(scheduled), [scheduled]);

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="flex items-center gap-2">
        <div className="inline-flex gap-1 rounded-lg border bg-muted p-1">
          <button type="button" onClick={() => setMode("appointments")} className={`rounded-md px-4 py-2 text-base font-semibold transition-all ${mode === "appointments" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
            📋 Appointments
          </button>
          <button type="button" onClick={() => setMode("workers")} className={`rounded-md px-4 py-2 text-base font-semibold transition-all ${mode === "workers" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
            👷 Workers Schedule
          </button>
        </div>
      </div>

      <div className={`flex-1 overflow-auto rounded-2xl border bg-card p-5 shadow-sm ${fcClasses}`}>
        <style>{`.fc .fc-timegrid-slot { height: 4rem !important; } .fc .fc-toolbar.fc-header-toolbar { margin-bottom: 1.5rem; }`}</style>
        <div className="min-w-[1040px]">
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
            eventContent={(info) => mode === "appointments" ? <AppointmentEventBlock info={info} /> : <WorkerEventBlock info={info} />}
            slotMinTime="06:00:00"
            slotMaxTime="20:00:00"
            slotDuration="01:00:00"
            height="auto"
            nowIndicator
            allDaySlot={false}
            dayMaxEvents={3}
            eventMaxStack={3}
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
  );
}

function toAppointmentEvent(appointment: AdminAppointment) {
  return {
    id: String(appointment.id),
    title: appointment.appointment_number,
    start: `${appointment.appointment_date}T${appointment.appointment_time_from}`,
    end: `${appointment.appointment_date}T${appointment.appointment_time_until}`,
    extendedProps: {
      full_name: appointment.full_name,
      status: appointment.status,
      time_from: appointment.appointment_time_from,
      time_until: appointment.appointment_time_until,
    },
    backgroundColor: "transparent",
    borderColor: "transparent",
  };
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

function AppointmentEventBlock({ info }: { info: EventContentArg }) {
  const props = info.event.extendedProps as { status: string; full_name: string; time_from: string; time_until: string };
  const color = statusColors[props.status] ?? statusColors.pending;
  const isMonthView = info.view.type === "dayGridMonth";

  if (isMonthView) {
    return (
      <div className={`flex w-full items-center gap-1.5 overflow-hidden rounded px-1.5 py-0.5 ${color.bg} ${color.text}`}>
        <span className={`size-1.5 shrink-0 rounded-full ${color.dot}`} />
        <span className="truncate text-[11px] font-semibold">{info.event.title}</span>
      </div>
    );
  }

  return (
    <div className={`flex h-full w-full flex-col overflow-hidden rounded-lg border-l-4 px-2 py-1 ${color.bg} ${color.border} ${color.text}`}>
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
    <div className={`flex h-full w-full flex-col overflow-hidden rounded-lg border-l-4 px-2 py-1 ${color.bg} ${color.border} ${color.text}`}>
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
