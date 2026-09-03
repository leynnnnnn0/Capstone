"use client";

import { useEffect, useMemo, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import listPlugin from "@fullcalendar/list";
import interactionPlugin from "@fullcalendar/interaction";
import type { EventClickArg, EventContentArg } from "@fullcalendar/core";
import Link from "next/link";
import {
  BriefcaseBusiness,
  CalendarDays,
  Clock,
  FileText,
  MapPin,
  Phone,
  Users,
} from "lucide-react";

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
import { adminStatusMeta, formatAdminDate, formatAdminTime } from "@/features/admin-appointments/admin-appointment-utils";
import { fmtPeso } from "@/features/admin-appointments/admin-quotation-line-utils";
import type { AdminAppointment } from "@/features/admin-appointments/types";
import type { AdminWorkJob } from "@/features/admin-work-jobs/types";

export type CalendarMode = "appointments" | "work_jobs" | "workers";

type AdminAppointmentCalendarProps = {
  appointments: AdminAppointment[];
  workJobs?: AdminWorkJob[];
  defaultMode?: CalendarMode;
  lockedMode?: CalendarMode;
  fitToContainer?: boolean;
  compact?: boolean;
};

type CalendarRecordKind = "appointment" | "work_job";
type SelectedRecord = { kind: CalendarRecordKind; id: number } | null;
type WorkerColor = (typeof workerPalette)[number];
type WorkerLike = { id: number; full_name: string };
type SlotItem = {
  date: string | null | undefined;
  time_from: string | null | undefined;
  time_until: string | null | undefined;
  workers: WorkerLike[];
};

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

const fcClasses = `[&_.fc]:font-sans [&_.fc-button]:rounded-md [&_.fc-button]:border [&_.fc-button]:border-border [&_.fc-button]:bg-background [&_.fc-button]:px-2 [&_.fc-button]:py-1 [&_.fc-button]:text-[11px] [&_.fc-button]:font-medium [&_.fc-button]:text-foreground [&_.fc-button]:shadow-none sm:[&_.fc-button]:px-2.5 sm:[&_.fc-button]:text-xs [&_.fc-button-active]:!border-primary [&_.fc-button-active]:!bg-primary [&_.fc-button-active]:!text-primary-foreground [&_.fc-button-primary]:!border-border [&_.fc-button-primary]:!bg-background [&_.fc-button-primary]:!text-foreground [&_.fc-button-primary.fc-button-active]:!bg-primary [&_.fc-button-primary.fc-button-active]:!text-primary-foreground [&_.fc-button-primary:hover]:!bg-muted [&_.fc-col-header-cell]:py-1.5 [&_.fc-col-header-cell-cushion]:text-[10px] [&_.fc-col-header-cell-cushion]:font-semibold [&_.fc-col-header-cell-cushion]:tracking-wide [&_.fc-col-header-cell-cushion]:text-muted-foreground [&_.fc-col-header-cell-cushion]:uppercase [&_.fc-col-header-cell-cushion]:no-underline sm:[&_.fc-col-header-cell-cushion]:text-xs [&_.fc-day-today]:!bg-primary/5 [&_.fc-daygrid-day-number]:text-[11px] [&_.fc-daygrid-day-number]:font-semibold [&_.fc-daygrid-day-number]:text-foreground [&_.fc-daygrid-day-number]:no-underline sm:[&_.fc-daygrid-day-number]:text-xs [&_.fc-event]:cursor-pointer [&_.fc-event]:border-none [&_.fc-event]:bg-transparent [&_.fc-event]:shadow-none [&_.fc-scrollgrid]:border-border [&_.fc-scrollgrid-section>td]:border-border [&_.fc-timegrid-slot]:border-border [&_.fc-timegrid-slot-label-cushion]:text-[10px] [&_.fc-timegrid-slot-label-cushion]:text-muted-foreground sm:[&_.fc-timegrid-slot-label-cushion]:text-xs [&_.fc-toolbar-title]:font-semibold [&_.fc-toolbar-title]:text-foreground [&_td.fc-day]:border-border [&_th.fc-day]:border-border`;

export default function AdminAppointmentCalendar({
  appointments,
  workJobs = [],
  defaultMode = "appointments",
  lockedMode,
  fitToContainer = false,
  compact = false,
}: AdminAppointmentCalendarProps) {
  const [mode, setMode] = useState<CalendarMode>(defaultMode);
  const [isMobile, setIsMobile] = useState(false);
  const activeMode = lockedMode ?? mode;
  const [selectedRecord, setSelectedRecord] = useState<SelectedRecord>(null);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 639px)");
    const updateMobileLayout = () => setIsMobile(mediaQuery.matches);

    updateMobileLayout();
    mediaQuery.addEventListener("change", updateMobileLayout);

    return () => mediaQuery.removeEventListener("change", updateMobileLayout);
  }, []);

  const scheduledAppointments = useMemo(
    () => appointments.filter((appointment) => appointment.appointment_date && appointment.appointment_time_from && appointment.appointment_time_until),
    [appointments],
  );
  const scheduledWorkJobs = useMemo(
    () => workJobs.filter((workJob) => workJob.scheduled_date && workJob.scheduled_time_from && workJob.scheduled_time_until),
    [workJobs],
  );
  const scheduledItems = useMemo(
    () => [
      ...scheduledAppointments.map((appointment) => ({
        date: appointment.appointment_date,
        time_from: appointment.appointment_time_from,
        time_until: appointment.appointment_time_until,
        workers: appointment.workers,
      })),
      ...scheduledWorkJobs.map((workJob) => ({
        date: workJob.scheduled_date,
        time_from: workJob.scheduled_time_from,
        time_until: workJob.scheduled_time_until,
        workers: workJob.workers,
      })),
    ],
    [scheduledAppointments, scheduledWorkJobs],
  );

  const initialDate = scheduledItems[0]?.date ?? new Date().toISOString().slice(0, 10);
  const workerColorMap = useMemo(() => buildWorkerColorMap(scheduledItems), [scheduledItems]);
  const appointmentEvents = useMemo(() => toAppointmentEvents(scheduledAppointments), [scheduledAppointments]);
  const workJobEvents = useMemo(() => toWorkJobEvents(scheduledWorkJobs), [scheduledWorkJobs]);
  const workerEvents = useMemo(
    () => toWorkerEvents(scheduledAppointments, scheduledWorkJobs, workerColorMap),
    [scheduledAppointments, scheduledWorkJobs, workerColorMap],
  );
  const slotRange = useMemo(() => calendarSlotRange(scheduledItems), [scheduledItems]);
  const selectedAppointment = selectedRecord?.kind === "appointment"
    ? appointments.find((appointment) => appointment.id === selectedRecord.id) ?? null
    : null;
  const selectedWorkJob = selectedRecord?.kind === "work_job"
    ? workJobs.find((workJob) => workJob.id === selectedRecord.id) ?? null
    : null;
  const calendarMinWidth = isMobile || fitToContainer
    ? "100%"
    : activeMode === "workers"
      ? Math.max(760, 7 * Math.max(maxConcurrentWorkerEvents(scheduledItems), 1) * 104)
      : 760;

  function handleEventClick(info: EventClickArg) {
    const kind = info.event.extendedProps.kind as CalendarRecordKind | undefined;
    const recordIds = info.event.extendedProps.record_ids as number[] | undefined;
    const recordId = recordIds?.[0] ?? Number(info.event.extendedProps.record_id ?? info.event.id);

    if (kind && recordId) setSelectedRecord({ kind, id: recordId });
  }

  return (
    <>
      <div className="flex h-full flex-col gap-3">
        {!lockedMode && (
          <div className="flex items-center gap-2">
            <div className="inline-flex gap-1 rounded-lg border bg-muted p-1">
              <ModeButton active={activeMode === "appointments"} onClick={() => setMode("appointments")}>
                📋 Appointments
              </ModeButton>
              <ModeButton active={activeMode === "work_jobs"} onClick={() => setMode("work_jobs")}>
                🧰 Work Jobs
              </ModeButton>
              <ModeButton active={activeMode === "workers"} onClick={() => setMode("workers")}>
                👷 Workers Schedule
              </ModeButton>
            </div>
          </div>
        )}

        <div className={`flex-1 ${fitToContainer ? "overflow-hidden" : "overflow-auto"} rounded-xl border bg-card p-2 shadow-sm sm:p-3 ${fcClasses}`}>
          <style>{`
            .fc .fc-timegrid-slot { height: ${compact ? "1.45rem" : "1.7rem"} !important; }
            .fc .fc-toolbar.fc-header-toolbar {
              align-items: center;
              display: grid;
              gap: 0.5rem;
              grid-template-columns: 1fr auto;
              margin-bottom: ${compact ? "0.5rem" : "0.75rem"};
            }
            .fc .fc-toolbar-chunk { display: flex; flex-wrap: wrap; gap: 0.25rem; min-width: 0; }
            .fc .fc-toolbar-chunk:nth-child(2) { grid-column: 1 / -1; grid-row: 1; justify-content: flex-start; }
            .fc .fc-toolbar-chunk:nth-child(1) { grid-column: 1; grid-row: 2; }
            .fc .fc-toolbar-chunk:nth-child(3) { grid-column: 2; grid-row: 2; justify-content: flex-end; }
            .fc .fc-toolbar-title {
              font-size: clamp(1rem, 5vw, 1.25rem) !important;
              line-height: 1.15 !important;
              max-width: 100%;
              overflow-wrap: anywhere;
            }
            .fc .fc-button {
              min-height: 1.85rem !important;
              padding: 0.25rem 0.45rem !important;
            }
            .fc .fc-daygrid-day-events { min-height: 1.25rem; }
            .fc .fc-timegrid-event-harness { inset-inline-end: 0 !important; }
            .fc .fc-timegrid-event { margin-inline-end: 0 !important; }
            .fc .fc-event-main { min-width: 0; }
            @media (min-width: 640px) {
              .fc .fc-toolbar.fc-header-toolbar {
                display: flex;
                align-items: flex-start;
              }
              .fc .fc-toolbar-chunk:nth-child(1),
              .fc .fc-toolbar-chunk:nth-child(2),
              .fc .fc-toolbar-chunk:nth-child(3) {
                grid-column: auto;
                grid-row: auto;
              }
              .fc .fc-toolbar-title { font-size: 1.125rem !important; }
            }
          `}</style>
          <div style={{ minWidth: calendarMinWidth }}>
            <FullCalendar
              key={`${activeMode}-${isMobile ? "list" : "calendar"}`}
              plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
              initialView={isMobile ? "listWeek" : "timeGridWeek"}
              initialDate={initialDate}
              headerToolbar={{
                left: "prev,next today",
                center: "title",
                right: isMobile ? "" : "dayGridMonth,timeGridWeek,timeGridDay,listWeek",
              }}
              buttonText={{ today: "Today", month: "Month", week: "Week", day: "Day", list: "List" }}
              events={activeMode === "appointments" ? appointmentEvents : activeMode === "work_jobs" ? workJobEvents : workerEvents}
              eventContent={(info) => {
                if (activeMode === "workers") return <WorkerEventBlock info={info} />;
                if (activeMode === "work_jobs") return <WorkJobEventBlock info={info} onSelect={(id) => setSelectedRecord({ kind: "work_job", id })} />;
                return <AppointmentEventBlock info={info} onSelect={(id) => setSelectedRecord({ kind: "appointment", id })} />;
              }}
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
              slotEventOverlap={activeMode === "workers" ? false : true}
              expandRows={false}
            />
          </div>
        </div>

        <CalendarLegend mode={activeMode} scheduledItems={scheduledItems} workerColorMap={workerColorMap} />
      </div>

      <AppointmentDetailsDrawer
        appointment={selectedAppointment}
        open={Boolean(selectedAppointment)}
        onOpenChange={(open) => !open && setSelectedRecord(null)}
      />
      <WorkJobDetailsDrawer
        workJob={selectedWorkJob}
        open={Boolean(selectedWorkJob)}
        onOpenChange={(open) => !open && setSelectedRecord(null)}
      />
    </>
  );
}

function ModeButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-all sm:px-3 sm:py-1.5 sm:text-sm ${
        active ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

function CalendarLegend({
  mode,
  scheduledItems,
  workerColorMap,
}: {
  mode: CalendarMode;
  scheduledItems: SlotItem[];
  workerColorMap: Map<number, WorkerColor>;
}) {
  if (mode === "workers") {
    return (
      <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
        {uniqueWorkers(scheduledItems).map((worker) => {
          const color = workerColorMap.get(worker.id) ?? workerPalette[0];
          return (
            <div key={worker.id} className="flex items-center gap-1.5">
              <span className={`size-2.5 rounded-full ${color.dot}`} />
              <span>{worker.full_name}</span>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
      {["pending", "confirmed", "in_progress", "completed", "cancelled"].map((status) => (
        <div key={status} className="flex items-center gap-1.5">
          <span className={`size-2.5 rounded-full ${statusColors[status].dot}`} />
          <span>{adminStatusMeta[status as keyof typeof adminStatusMeta]?.label ?? labelize(status)}</span>
        </div>
      ))}
    </div>
  );
}

function toAppointmentEvents(appointments: AdminAppointment[]) {
  return overlappingAppointmentGroups(appointments).map((group) => {
    const first = group[0];
    const start = minTime(group.map((appointment) => appointment.appointment_time_from));
    const end = maxTime(group.map((appointment) => appointment.appointment_time_until));

    return {
      id: `appointment-${group.map((appointment) => appointment.id).join("-")}`,
      title: group.length === 1 ? first.appointment_number : `${group.length} appointments`,
      start: `${first.appointment_date}T${start}`,
      end: `${first.appointment_date}T${end}`,
      extendedProps: {
        kind: "appointment" satisfies CalendarRecordKind,
        record_id: first.id,
        record_ids: group.map((appointment) => appointment.id),
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

function toWorkJobEvents(workJobs: AdminWorkJob[]) {
  return overlappingWorkJobGroups(workJobs).map((group) => {
    const first = group[0];
    const start = minTime(group.map((workJob) => workJob.scheduled_time_from));
    const end = maxTime(group.map((workJob) => workJob.scheduled_time_until));

    return {
      id: `work-job-${group.map((workJob) => workJob.id).join("-")}`,
      title: group.length === 1 ? first.work_job_number : `${group.length} work jobs`,
      start: `${first.scheduled_date}T${start}`,
      end: `${first.scheduled_date}T${end}`,
      extendedProps: {
        kind: "work_job" satisfies CalendarRecordKind,
        record_id: first.id,
        record_ids: group.map((workJob) => workJob.id),
        workJobs: group,
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

function toWorkerEvents(
  appointments: AdminAppointment[],
  workJobs: AdminWorkJob[],
  workerColorMap: Map<number, WorkerColor>,
) {
  const appointmentEvents = appointments.flatMap((appointment) =>
    appointment.workers.map((worker) => ({
      id: `worker-${worker.id}-appointment-${appointment.id}`,
      title: appointment.appointment_number,
      start: `${appointment.appointment_date}T${appointment.appointment_time_from}`,
      end: `${appointment.appointment_date}T${appointment.appointment_time_until}`,
      extendedProps: {
        kind: "appointment" satisfies CalendarRecordKind,
        record_id: appointment.id,
        record_type_label: "Appointment",
        full_name: appointment.full_name,
        worker_name: worker.full_name,
        time_from: appointment.appointment_time_from,
        time_until: appointment.appointment_time_until,
        workerColor: workerColorMap.get(worker.id) ?? workerPalette[0],
      },
      backgroundColor: "transparent",
      borderColor: "transparent",
    })),
  );

  const workJobEvents = workJobs.flatMap((workJob) =>
    workJob.workers.map((worker) => ({
      id: `worker-${worker.id}-work-job-${workJob.id}`,
      title: workJob.work_job_number,
      start: `${workJob.scheduled_date}T${workJob.scheduled_time_from}`,
      end: `${workJob.scheduled_date}T${workJob.scheduled_time_until}`,
      extendedProps: {
        kind: "work_job" satisfies CalendarRecordKind,
        record_id: workJob.id,
        record_type_label: workJob.is_back_job ? "Back Job" : "Work Job",
        full_name: workJob.full_name,
        worker_name: worker.full_name,
        time_from: workJob.scheduled_time_from,
        time_until: workJob.scheduled_time_until,
        workerColor: workerColorMap.get(worker.id) ?? workerPalette[0],
      },
      backgroundColor: "transparent",
      borderColor: "transparent",
    })),
  );

  return [...appointmentEvents, ...workJobEvents];
}

function AppointmentDetailsDrawer({
  appointment,
  open,
  onOpenChange,
}: {
  appointment: AdminAppointment | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const quoteTotal = approvedQuoteTotal(appointment?.quotation?.items);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full overflow-y-auto p-3 sm:max-w-md">
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

              <ScheduleDetails
                date={appointment.appointment_date}
                timeFrom={appointment.appointment_time_from}
                timeUntil={appointment.appointment_time_until}
                phone={appointment.phone_number}
                address={appointment.address}
              />

              <WorkersPanel workers={appointment.workers} />
              <QuotationPanel total={quoteTotal} itemCount={appointment.quotation?.items.length ?? 0} />
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

function WorkJobDetailsDrawer({
  workJob,
  open,
  onOpenChange,
}: {
  workJob: AdminWorkJob | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const quoteTotal = approvedQuoteTotal(workJob?.quotation?.items);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full overflow-y-auto p-3 sm:max-w-md">
        {workJob && (
          <>
            <SheetHeader className="text-left">
              <SheetTitle className="text-base">{workJob.work_job_number}</SheetTitle>
              <SheetDescription>{workJob.full_name}</SheetDescription>
            </SheetHeader>

            <div className="mt-6 space-y-5">
              <div className="flex items-center justify-between gap-3">
                <AdminAppointmentStatusBadge status={workJob.status} />
                <Button asChild size="sm">
                  <Link href={`/dashboard/work-jobs/${workJob.id}`}>View Work Job</Link>
                </Button>
              </div>

              <div className="rounded-lg border p-4">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-primary">
                  <BriefcaseBusiness className="size-4" />
                  {workJob.is_back_job ? "Back Job" : "Work Job"}
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  {workJob.appointment?.appointment_number
                    ? `Linked to ${workJob.appointment.appointment_number}`
                    : "Standalone scheduled work."}
                </p>
              </div>

              <ScheduleDetails
                date={workJob.scheduled_date}
                timeFrom={workJob.scheduled_time_from}
                timeUntil={workJob.scheduled_time_until}
                phone={workJob.phone_number}
                address={workJob.address}
              />

              <WorkersPanel workers={workJob.workers} />
              <QuotationPanel total={quoteTotal} itemCount={workJob.quotation?.items.length ?? 0} />
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

function ScheduleDetails({
  date,
  timeFrom,
  timeUntil,
  phone,
  address,
}: {
  date: string | null | undefined;
  timeFrom: string | null | undefined;
  timeUntil: string | null | undefined;
  phone: string | null | undefined;
  address: string | null | undefined;
}) {
  return (
    <div className="space-y-3 rounded-lg border p-4 text-sm">
      <Detail icon={CalendarDays} label="Date" value={formatAdminDate(date)} />
      <Detail icon={Clock} label="Time" value={`${formatAdminTime(timeFrom)} - ${formatAdminTime(timeUntil)}`} />
      <Detail icon={Phone} label="Phone" value={phone ?? "-"} />
      <Detail icon={MapPin} label="Address" value={address ?? "-"} />
    </div>
  );
}

function WorkersPanel({ workers }: { workers: WorkerLike[] }) {
  return (
    <div className="space-y-3 rounded-lg border p-4">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-primary">
        <Users className="size-4" />
        Assigned Workers
      </div>
      {workers.length ? (
        <div className="flex flex-wrap gap-2">
          {workers.map((worker) => (
            <span key={worker.id} className="rounded-full bg-muted px-3 py-1 text-xs">
              {worker.full_name}
            </span>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">No workers assigned yet.</p>
      )}
    </div>
  );
}

function QuotationPanel({ total, itemCount }: { total: number; itemCount: number }) {
  return (
    <div className="rounded-lg border p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-primary">
          <FileText className="size-4" />
          Quotation
        </div>
        <span className="text-sm font-semibold">₱{fmtPeso(total)}</span>
      </div>
      <Separator className="my-3" />
      <p className="text-sm text-muted-foreground">
        {itemCount ? `${itemCount} item${itemCount === 1 ? "" : "s"} attached` : "No quotation attached."}
      </p>
    </div>
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

function AppointmentEventBlock({
  info,
  onSelect,
}: {
  info: EventContentArg;
  onSelect: (id: number) => void;
}) {
  const props = info.event.extendedProps as {
    appointments?: AdminAppointment[];
    status: string;
    full_name: string;
    time_from: string;
    time_until: string;
  };
  const group = props.appointments ?? [];
  return (
    <GroupedEventBlock
      info={info}
      group={group}
      getId={(appointment) => appointment.id}
      getNumber={(appointment) => appointment.appointment_number}
      getName={(appointment) => appointment.full_name}
      getStatus={(appointment) => appointment.status}
      status={props.status}
      fullName={props.full_name}
      timeFrom={props.time_from}
      timeUntil={props.time_until}
      onSelect={onSelect}
    />
  );
}

function WorkJobEventBlock({
  info,
  onSelect,
}: {
  info: EventContentArg;
  onSelect: (id: number) => void;
}) {
  const props = info.event.extendedProps as {
    workJobs?: AdminWorkJob[];
    status: string;
    full_name: string;
    time_from: string;
    time_until: string;
  };
  const group = props.workJobs ?? [];
  return (
    <GroupedEventBlock
      info={info}
      group={group}
      getId={(workJob) => workJob.id}
      getNumber={(workJob) => workJob.work_job_number}
      getName={(workJob) => workJob.full_name}
      getStatus={(workJob) => workJob.status}
      status={props.status}
      fullName={props.full_name}
      timeFrom={props.time_from}
      timeUntil={props.time_until}
      onSelect={onSelect}
    />
  );
}

function GroupedEventBlock<T>({
  info,
  group,
  getId,
  getNumber,
  getName,
  getStatus,
  status,
  fullName,
  timeFrom,
  timeUntil,
  onSelect,
}: {
  info: EventContentArg;
  group: T[];
  getId: (item: T) => number;
  getNumber: (item: T) => string;
  getName: (item: T) => string;
  getStatus: (item: T) => string;
  status: string;
  fullName: string;
  timeFrom: string;
  timeUntil: string;
  onSelect: (id: number) => void;
}) {
  const color = statusColors[status] ?? statusColors.pending;
  const isMonthView = info.view.type === "dayGridMonth";

  if (isMonthView) {
    if (group.length > 1) {
      return (
        <div className="space-y-0.5">
          {group.map((item) => {
            const itemColor = statusColors[getStatus(item)] ?? statusColors.pending;

            return (
              <button
                key={getId(item)}
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  onSelect(getId(item));
                }}
                className={`flex w-full items-center gap-1.5 overflow-hidden rounded px-1.5 py-0.5 text-left ${itemColor.bg} ${itemColor.text}`}
              >
                <span className={`size-1.5 shrink-0 rounded-full ${itemColor.dot}`} />
                <span className="truncate text-[11px] font-semibold">{getNumber(item)}</span>
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
        {group.map((item) => {
          const itemColor = statusColors[getStatus(item)] ?? statusColors.pending;

          return (
            <button
              key={getId(item)}
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onSelect(getId(item));
              }}
              className={`min-h-8 rounded-md border-l-4 px-1.5 py-1 text-left ${itemColor.bg} ${itemColor.border} ${itemColor.text}`}
            >
              <p className="truncate text-[11px] font-bold leading-tight">{getNumber(item)}</p>
              <p className="truncate text-[10px] leading-tight opacity-80">{getName(item)}</p>
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className={`flex h-full w-full flex-col overflow-hidden rounded-md border-l-4 px-1.5 py-1 ${color.bg} ${color.border} ${color.text}`}>
      <p className="truncate text-[11px] font-bold leading-tight">{info.event.title}</p>
      <p className="truncate text-[10px] leading-tight opacity-80">{fullName}</p>
      <p className="text-[10px] leading-tight opacity-70">
        {formatAdminTime(timeFrom)} - {formatAdminTime(timeUntil)}
      </p>
    </div>
  );
}

function WorkerEventBlock({ info }: { info: EventContentArg }) {
  const props = info.event.extendedProps as {
    full_name: string;
    worker_name: string;
    record_type_label: string;
    time_from: string;
    time_until: string;
    workerColor: WorkerColor;
  };
  const color = props.workerColor;

  return (
    <div className={`flex h-full w-full flex-col overflow-hidden rounded-md border-l-4 px-1.5 py-1 ${color.bg} ${color.border} ${color.text}`}>
      <p className="truncate text-[11px] font-bold leading-tight">{info.event.title}</p>
      <p className="truncate text-[10px] font-semibold leading-tight opacity-90">{props.worker_name}</p>
      <p className="truncate text-[10px] leading-tight opacity-70">{props.record_type_label} · {props.full_name}</p>
      <p className="text-[10px] leading-tight opacity-60">
        {formatAdminTime(props.time_from)} - {formatAdminTime(props.time_until)}
      </p>
    </div>
  );
}

function uniqueWorkers(items: SlotItem[]) {
  const workers = new Map<number, WorkerLike>();
  items.forEach((item) => item.workers.forEach((worker) => workers.set(worker.id, worker)));
  return Array.from(workers.values());
}

function buildWorkerColorMap(items: SlotItem[]) {
  const workers = uniqueWorkers(items);
  return new Map(workers.map((worker, index) => [worker.id, workerPalette[index % workerPalette.length]]));
}

function overlappingAppointmentGroups(appointments: AdminAppointment[]) {
  return overlappingGroups(appointments, {
    date: (appointment) => appointment.appointment_date,
    start: (appointment) => appointment.appointment_time_from,
    end: (appointment) => appointment.appointment_time_until,
  });
}

function overlappingWorkJobGroups(workJobs: AdminWorkJob[]) {
  return overlappingGroups(workJobs, {
    date: (workJob) => workJob.scheduled_date,
    start: (workJob) => workJob.scheduled_time_from,
    end: (workJob) => workJob.scheduled_time_until,
  });
}

function overlappingGroups<T>(
  records: T[],
  accessors: {
    date: (record: T) => string | null | undefined;
    start: (record: T) => string | null | undefined;
    end: (record: T) => string | null | undefined;
  },
) {
  const byDate = new Map<string, T[]>();

  records.forEach((record) => {
    const date = String(accessors.date(record));
    byDate.set(date, [...(byDate.get(date) ?? []), record]);
  });

  return Array.from(byDate.values()).flatMap((items) => {
    const sorted = [...items].sort((a, b) => minutes(accessors.start(a)) - minutes(accessors.start(b)));
    const groups: T[][] = [];

    sorted.forEach((record) => {
      const start = minutes(accessors.start(record));
      const current = groups.at(-1);

      if (!current) {
        groups.push([record]);
        return;
      }

      const currentEnd = Math.max(...current.map((item) => minutes(accessors.end(item))));

      if (start < currentEnd) {
        current.push(record);
        return;
      }

      groups.push([record]);
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

function calendarSlotRange(items: SlotItem[]) {
  if (!items.length) {
    return { min: "08:00:00", max: "18:00:00" };
  }

  const starts = items.map((item) => minutes(item.time_from));
  const ends = items.map((item) => minutes(item.time_until));
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

function maxConcurrentWorkerEvents(items: SlotItem[]) {
  const grouped = new Map<string, number>();

  items.forEach((item) => {
    const key = [item.date, item.time_from, item.time_until].join("|");
    grouped.set(key, (grouped.get(key) ?? 0) + item.workers.length);
  });

  return Math.max(1, ...grouped.values());
}

function approvedQuoteTotal(items: Array<{ status: string | null; total_amount: number }> | undefined) {
  return items?.filter((item) => item.status === "approved").reduce((sum, item) => sum + Number(item.total_amount || 0), 0) ?? 0;
}

function labelize(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}
