"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarDays, CheckCircle2, Clock, Loader2, Users } from "lucide-react";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import WorkerMultiSelect from "@/components/admin-appointments/WorkerMultiSelect";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  confirmAppointment,
  fetchAvailableWorkers,
  rescheduleAppointment,
} from "@/features/admin-appointments/admin-appointment-api";
import { formatAdminDate, formatAdminTime } from "@/features/admin-appointments/admin-appointment-utils";
import type { AdminAppointment, AdminWorker, SchedulePayload } from "@/features/admin-appointments/types";
import {
  addScheduleIssues,
  requiredDateSchema,
  requiredTimeSchema,
  zodIssuesToFieldErrors,
} from "@/features/forms/validation";
import { ApiError } from "@/lib/api";

type ScheduleErrors = Partial<Record<keyof SchedulePayload | "form", string>>;

const scheduleSchema = z
  .object({
    appointment_date: requiredDateSchema("Appointment date"),
    appointment_time_from: requiredTimeSchema("Start time"),
    appointment_time_until: requiredTimeSchema("End time"),
    worker_ids: z.array(z.number()).min(1, "Please assign at least one worker."),
    remarks: z.string().trim().max(1000, "Remarks must be 1000 characters or fewer.").optional(),
  })
  .superRefine((data, context) => {
    addScheduleIssues(context, {
      startDate: data.appointment_date,
      startDateField: "appointment_date",
      startTime: data.appointment_time_from,
      startTimeField: "appointment_time_from",
      endTime: data.appointment_time_until,
      endTimeField: "appointment_time_until",
      allowPastStartDate: true,
    });
  });

export default function AdminScheduleForm({
  appointment,
  workers,
  onUpdated,
  readOnly = false,
}: {
  appointment: AdminAppointment;
  workers: AdminWorker[];
  onUpdated: (appointment: AdminAppointment) => void;
  readOnly?: boolean;
}) {
  const [data, setData] = useState<SchedulePayload>({
    appointment_date: appointment.appointment_date ?? "",
    appointment_time_from: appointment.appointment_time_from ?? "",
    appointment_time_until: appointment.appointment_time_until ?? "",
    worker_ids: appointment.workers.map((worker) => worker.id),
    remarks: "",
  });
  const [availableWorkers, setAvailableWorkers] = useState<AdminWorker[]>(workers);
  const [errors, setErrors] = useState<ScheduleErrors>({});
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const canReschedule = ["confirmed", "on_the_way", "in_progress"].includes(appointment.status);
  const canSetSchedule = ["pending", "rescheduled", "reopened"].includes(appointment.status);
  const canSchedule = !readOnly && (canSetSchedule || canReschedule);
  const scheduleButtonLabel = canSetSchedule ? "Set Schedule" : "Reschedule";
  const selectedWorkerNames = useMemo(
    () => data.worker_ids.map((id) => workers.find((worker) => worker.id === id)?.full_name).filter(Boolean).join(", "),
    [data.worker_ids, workers],
  );

  function openScheduleDialog() {
    setData({
      appointment_date: appointment.appointment_date ?? "",
      appointment_time_from: appointment.appointment_time_from ?? "",
      appointment_time_until: appointment.appointment_time_until ?? "",
      worker_ids: appointment.workers.map((worker) => worker.id),
      remarks: "",
    });
    setAvailableWorkers(workers);
    setErrors({});
    setScheduleOpen(true);
  }

  useEffect(() => {
    if (!data.appointment_date || !data.appointment_time_from || !data.appointment_time_until) return;

    fetchAvailableWorkers({
      appointment_id: appointment.id,
      appointment_date: data.appointment_date,
      appointment_time_from: data.appointment_time_from,
      appointment_time_until: data.appointment_time_until,
      worker_ids: data.worker_ids,
    })
      .then((response) => setAvailableWorkers(response.data))
      .catch(() => undefined);
  }, [appointment.id, data.appointment_date, data.appointment_time_from, data.appointment_time_until, data.worker_ids]);

  function setField<K extends keyof SchedulePayload>(field: K, value: SchedulePayload[K]) {
    setData((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined, form: undefined }));
  }

  function validate() {
    const parsed = scheduleSchema.safeParse(data);

    if (!parsed.success) {
      setErrors(zodIssuesToFieldErrors<keyof SchedulePayload | "form">(parsed.error.issues));
      return false;
    }

    setErrors({});
    return true;
  }

  async function saveSchedule() {
    const parsed = scheduleSchema.safeParse(data);

    if (!parsed.success) {
      setErrors(zodIssuesToFieldErrors<keyof SchedulePayload | "form">(parsed.error.issues));
      setConfirmOpen(false);
      return;
    }

    setSaving(true);
    setErrors({});

    const payload = parsed.data as SchedulePayload;

    try {
      const response =
        canSetSchedule
          ? await confirmAppointment(appointment.id, payload)
          : await rescheduleAppointment(appointment.id, payload);

      onUpdated(response.data);
      setScheduleOpen(false);
      setConfirmOpen(false);
    } catch (error) {
      setErrors(toScheduleErrors(error));
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <div className="space-y-4 rounded-lg border bg-card p-5 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-widest text-primary">
              Appointment Slot
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">Inspection schedule and assigned team.</p>
          </div>
          {canSchedule && (
            <Button type="button" variant="ghost" size="sm" onClick={openScheduleDialog}>
              {scheduleButtonLabel}
            </Button>
          )}
        </div>

        <div className="space-y-3">
          <DisplayRow icon={CalendarDays} label="Appointment Date" value={formatAdminDate(appointment.appointment_date)} />
          <div className="grid grid-cols-2 gap-3">
            <DisplayRow icon={Clock} label="From" value={formatAdminTime(appointment.appointment_time_from) || "-"} />
            <DisplayRow icon={Clock} label="Until" value={formatAdminTime(appointment.appointment_time_until) || "-"} />
          </div>
          <DisplayRow
            icon={Users}
            label="Assigned Workers"
            value={appointment.workers.length ? appointment.workers.map((worker) => worker.full_name).join(", ") : "No workers assigned yet"}
          />
        </div>

        {errors.form && <p className="rounded-md bg-red-50 p-3 text-sm text-red-600">{errors.form}</p>}
      </div>

      <Dialog open={scheduleOpen} onOpenChange={setScheduleOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{canSetSchedule ? "Set appointment schedule" : "Reschedule appointment"}</DialogTitle>
            <DialogDescription>Set the inspection date, time range, and assigned workers.</DialogDescription>
          </DialogHeader>

          <form
            onSubmit={(event) => {
              event.preventDefault();
              if (validate()) setConfirmOpen(true);
            }}
            className="space-y-4"
          >
            <div className="space-y-1.5">
              <Label htmlFor="appointment_date">Appointment Date</Label>
              <Input
                id="appointment_date"
                type="date"
                value={data.appointment_date}
                onChange={(event) => setField("appointment_date", event.target.value)}
              />
              {errors.appointment_date && <p className="text-xs text-red-500">{errors.appointment_date}</p>}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="appointment_time_from">From</Label>
                <Input id="appointment_time_from" type="time" value={data.appointment_time_from} onChange={(event) => setField("appointment_time_from", event.target.value)} />
                {errors.appointment_time_from && <p className="text-xs text-red-500">{errors.appointment_time_from}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="appointment_time_until">Until</Label>
                <Input id="appointment_time_until" type="time" value={data.appointment_time_until} onChange={(event) => setField("appointment_time_until", event.target.value)} />
                {errors.appointment_time_until && <p className="text-xs text-red-500">{errors.appointment_time_until}</p>}
              </div>
            </div>

            <WorkerMultiSelect
              workers={availableWorkers}
              value={data.worker_ids}
              onChange={(value) => setField("worker_ids", value)}
              label="Assign Workers"
              error={errors.worker_ids}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setScheduleOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={saving}>
                {saving ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
                Review Slot
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{canSetSchedule ? "Confirm appointment slot" : "Reschedule appointment"}</DialogTitle>
            <DialogDescription>Review the slot details before saving.</DialogDescription>
          </DialogHeader>
          <div className="rounded-lg border text-sm">
            <ModalRow label="Customer" value={appointment.full_name} />
            <ModalRow label="Date" value={data.appointment_date || "-"} />
            <ModalRow label="Time" value={`${data.appointment_time_from || "-"} - ${data.appointment_time_until || "-"}`} />
            <ModalRow label="Workers" value={selectedWorkerNames || "-"} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="schedule_remarks">{canSetSchedule ? "Remarks" : "Reason"}</Label>
            <Textarea id="schedule_remarks" value={data.remarks ?? ""} onChange={(event) => setField("remarks", event.target.value)} className="resize-none" />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setConfirmOpen(false)}>Go Back</Button>
            <Button type="button" onClick={saveSchedule} disabled={saving}>{saving ? "Saving..." : "Save Slot"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function DisplayRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof CalendarDays;
  label: string;
  value: string;
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
        <Icon className="size-3.5" />
        {label}
      </div>
      <div className="rounded-md border bg-muted/30 px-3 py-2 text-sm font-medium">{value}</div>
    </div>
  );
}

function ModalRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b px-3 py-2 last:border-b-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}

function toScheduleErrors(error: unknown): ScheduleErrors {
  if (!(error instanceof ApiError)) return { form: "Unable to save appointment slot." };
  if (!error.errors) return { form: error.message };

  return Object.entries(error.errors).reduce<ScheduleErrors>((acc, [field, value]) => {
    acc[field as keyof ScheduleErrors] = Array.isArray(value) ? value[0] : value;
    return acc;
  }, {});
}
