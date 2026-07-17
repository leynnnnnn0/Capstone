"use client";

import { useEffect, useMemo, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { BriefcaseBusiness, CalendarDays, FileText, Loader2, Percent, Users } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

import AdminAppointmentCalendar from "@/components/admin-appointments/AdminAppointmentCalendar";
import AdminQuotationDetails from "@/components/admin-appointments/AdminQuotationDetails";
import WorkerMultiSelect from "@/components/admin-appointments/WorkerMultiSelect";
import NameInput from "@/components/form/NameInput";
import NumericInput from "@/components/form/NumericInput";
import PhoneNumberInput from "@/components/form/PhoneNumberInput";
import LocationPicker from "@/components/landing/LocationPicker";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FormPageSkeleton } from "@/components/ui/page-skeletons";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { ApiError } from "@/lib/api";
import {
  fetchAvailableWorkers,
  fetchAdminAppointment,
  fetchAdminAppointments,
} from "@/features/admin-appointments/admin-appointment-api";
import type { AdminAppointment, AdminWorker } from "@/features/admin-appointments/types";
import {
  createAdminWorkJob,
  fetchAdminWorkJob,
  updateAdminWorkJob,
} from "@/features/admin-work-jobs/admin-work-job-api";
import {
  emptyWorkJobForm,
  workJobFormFromAppointment,
  workJobFormFromWorkJob,
} from "@/features/admin-work-jobs/admin-work-job-utils";
import type { AdminWorkJob, AdminWorkJobForm as WorkJobFormValues } from "@/features/admin-work-jobs/types";
import {
  addScheduleIssues,
  optionalEmailSchema,
  personNameSchema,
  philippineMobileSchema,
  requiredDateSchema,
  requiredTimeSchema,
  todayIsoDate,
  zodIssuesToFieldErrors,
} from "@/features/forms/validation";

const workJobSchema = z.object({
  first_name: personNameSchema("First name"),
  last_name: personNameSchema("Last name"),
  phone_number: philippineMobileSchema(),
  email: optionalEmailSchema(),
  address: z.string().trim().min(5, "Address is required."),
  service_type: z.string().min(1, "Service type is required."),
  service_type_other: z.string().trim().optional(),
  scheduled_date: requiredDateSchema("Work job date"),
  scheduled_time_from: requiredTimeSchema("Start time"),
  scheduled_time_until: requiredTimeSchema("End time"),
  worker_ids: z.array(z.number()).min(1, "Assign at least one worker."),
  is_down_payment_required: z.boolean(),
  down_payment_percentage: z.coerce
    .number()
    .min(1, "Down payment must be at least 1%.")
    .max(100, "Down payment cannot exceed 100%."),
  fabrication_status: z.enum([
    "not_required",
    "pending",
    "materials_preparation",
    "waiting_for_materials",
    "queued",
    "in_progress",
    "quality_check",
    "on_hold",
    "ready_for_installation",
  ]),
  fabrication_expected_completion_date: z.string().optional(),
  fabrication_notes: z.string().max(2000, "Fabrication notes must be 2000 characters or fewer.").optional(),
  notes: z.string().max(2000, "Notes must be 2000 characters or fewer.").optional(),
}).superRefine((value, context) => {
  if (value.service_type === "other" && !value.service_type_other?.trim()) {
    context.addIssue({
      code: "custom",
      path: ["service_type_other"],
      message: "Describe the service type.",
    });
  }

  if (
    value.fabrication_status !== "not_required" &&
    value.fabrication_status !== "ready_for_installation" &&
    !value.fabrication_expected_completion_date
  ) {
    context.addIssue({
      code: "custom",
      path: ["fabrication_expected_completion_date"],
      message: "Set an expected fabrication completion date for the customer.",
    });
  }

  addScheduleIssues(context, {
    startDate: value.scheduled_date,
    startDateField: "scheduled_date",
    startTime: value.scheduled_time_from,
    startTimeField: "scheduled_time_from",
    endTime: value.scheduled_time_until,
    endTimeField: "scheduled_time_until",
    allowPastStartDate: false,
    requireFutureStart: true,
  });
});

const serviceOptions = [
  { value: "installation", label: "Installation" },
  { value: "repair", label: "Repair" },
  { value: "quotation", label: "Quotation" },
  { value: "other", label: "Other" },
];

function currentTimeValue(now = new Date()) {
  return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
}

type FormErrors = Partial<Record<keyof WorkJobFormValues, string>>;

export default function AdminWorkJobForm({ workJobId }: { workJobId?: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const appointmentId = searchParams.get("appointment");
  const isEditing = Boolean(workJobId);
  const [data, setData] = useState<WorkJobFormValues>(() => emptyWorkJobForm());
  const [workers, setWorkers] = useState<AdminWorker[]>([]);
  const [appointment, setAppointment] = useState<AdminAppointment | null>(null);
  const [workJob, setWorkJob] = useState<AdminWorkJob | null>(null);
  const [appointments, setAppointments] = useState<AdminAppointment[]>([]);
  const [errors, setErrors] = useState<FormErrors>({});
  const [loadingAppointment, setLoadingAppointment] = useState(Boolean(appointmentId && !workJobId));
  const [loadingWorkJob, setLoadingWorkJob] = useState(Boolean(workJobId));
  const [saving, setSaving] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [quotationOpen, setQuotationOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    fetchAdminAppointments({ per_page: "100" }).then((response) => setAppointments(response.data));
  }, []);

  useEffect(() => {
    if (!data.scheduled_date || !data.scheduled_time_from || !data.scheduled_time_until) {
      setWorkers([]);
      return;
    }

    fetchAvailableWorkers({
      appointment_id: data.appointment_id ?? undefined,
      work_job_id: workJob?.id,
      appointment_date: data.scheduled_date,
      appointment_time_from: data.scheduled_time_from,
      appointment_time_until: data.scheduled_time_until,
      worker_ids: [],
    })
      .then((response) => setWorkers(response.data))
      .catch(() => setWorkers([]));
  }, [
    data.appointment_id,
    data.scheduled_date,
    data.scheduled_time_from,
    data.scheduled_time_until,
    workJob?.id,
  ]);

  useEffect(() => {
    if (workJobId || !appointmentId) return;

    fetchAdminAppointment(appointmentId)
      .then((response) => {
        setAppointment(response.data);
        setData(workJobFormFromAppointment(response.data));
      })
      .finally(() => setLoadingAppointment(false));
  }, [appointmentId, workJobId]);

  useEffect(() => {
    if (!workJobId) return;

    fetchAdminWorkJob(workJobId)
      .then((response) => {
        setWorkJob(response.data);
        setAppointment(response.data.appointment ?? null);
        setData(workJobFormFromWorkJob(response.data));
      })
      .catch(() => toast.error("Unable to load work job."))
      .finally(() => setLoadingWorkJob(false));
  }, [workJobId]);

  const sourceLabel = useMemo(() => {
    if (isEditing && workJob) return `Editing ${workJob.work_job_number}`;
    if (!appointment) return null;
    return `Prefilled from ${appointment.appointment_number}`;
  }, [appointment, isEditing, workJob]);

  const attachedQuotation = workJob?.quotation ?? appointment?.quotation ?? null;
  const quoteTotal = attachedQuotation?.total ?? 0;
  const downPaymentAmount = data.is_down_payment_required
    ? Number(quoteTotal) * (Number(data.down_payment_percentage || 0) / 100)
    : 0;
  const today = todayIsoDate();
  const startTimeMin = data.scheduled_date === today ? currentTimeValue() : undefined;

  function setField<Key extends keyof WorkJobFormValues>(field: Key, value: WorkJobFormValues[Key]) {
    setData((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const parsed = workJobSchema.safeParse(data);
    if (!parsed.success) {
      setErrors(zodIssuesToFieldErrors<keyof WorkJobFormValues>(parsed.error.issues) as FormErrors);
      return;
    }

    setConfirmOpen(true);
  }

  async function saveWorkJob() {
    const parsed = workJobSchema.safeParse(data);
    if (!parsed.success) {
      setErrors(zodIssuesToFieldErrors<keyof WorkJobFormValues>(parsed.error.issues) as FormErrors);
      setConfirmOpen(false);
      return;
    }

    setSaving(true);
    setErrors({});
    try {
      const payload = { ...data, ...parsed.data };
      const response = isEditing && workJobId
        ? await updateAdminWorkJob(workJobId, payload)
        : await createAdminWorkJob(payload);
      toast.success(isEditing ? "Work job updated successfully." : "Work job created successfully.");
      router.push(`/dashboard/work-jobs/${response.data.id}`);
    } catch (error) {
      if (error instanceof ApiError && error.errors) {
        setErrors(Object.fromEntries(Object.entries(error.errors).map(([key, value]) => [key, Array.isArray(value) ? value[0] : value])) as FormErrors);
      }
      toast.error(error instanceof ApiError ? error.message : isEditing ? "Unable to update work job." : "Unable to create work job.");
      setConfirmOpen(false);
    } finally {
      setSaving(false);
    }
  }

  if (loadingAppointment || loadingWorkJob) {
    return <FormPageSkeleton />;
  }

  return (
    <>
    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-primary">
            {isEditing ? "Edit Work Job" : "Create Work Job"}
          </p>
          <h1 className="mt-2 text-3xl font-black tracking-tight">
            {isEditing ? workJob?.work_job_number ?? "Edit work job" : "New work job"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {isEditing
              ? "Update the work job details, schedule, workers, and payment terms."
              : "Create the work job, set the production slot, and attach the quotation."}
          </p>
          {sourceLabel && <p className="mt-1 text-xs font-semibold text-primary">{sourceLabel}</p>}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={() => setCalendarOpen(true)}>
            <CalendarDays className="size-3.5" />
            Open Calendar
          </Button>
          <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={() => setQuotationOpen(true)}>
            <FileText className="size-3.5" />
            {attachedQuotation ? "View Quotation" : "Create Quotation"}
          </Button>
        </div>
      </div>

      <form onSubmit={submit} className="mt-5 grid gap-5 xl:grid-cols-[1fr_380px]">
        <div className="space-y-5">
          <section className="rounded-lg border bg-card p-5 shadow-sm">
            <SectionTitle title="Customer Details" description="Basic contact and service information." />
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field label="First Name" error={errors.first_name}>
                <NameInput value={data.first_name} onValueChange={(value) => setField("first_name", value)} />
              </Field>
              <Field label="Last Name" error={errors.last_name}>
                <NameInput value={data.last_name} onValueChange={(value) => setField("last_name", value)} />
              </Field>
              <Field label="Phone Number" error={errors.phone_number}>
                <PhoneNumberInput value={data.phone_number} onValueChange={(value) => setField("phone_number", value)} />
              </Field>
              <Field label="Email" error={errors.email}>
                <Input type="email" value={data.email} onChange={(event) => setField("email", event.target.value)} />
              </Field>
              <Field label="Service Type" error={errors.service_type}>
                <Select value={data.service_type} onValueChange={(value) => setField("service_type", value)}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {serviceOptions.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
              {data.service_type === "other" && (
                <Field label="Other Service" error={errors.service_type_other}>
                  <Input value={data.service_type_other} onChange={(event) => setField("service_type_other", event.target.value)} />
                </Field>
              )}
            </div>

            <div className="mt-4">
              <Label className="mb-1.5 block">Service Address</Label>
            <LocationPicker
              initialValue={{
                address: data.address,
                pinned: data.address_pinned,
                lat: data.address_lat ? Number(data.address_lat) : null,
                lng: data.address_lng ? Number(data.address_lng) : null,
              }}
              error={errors.address}
              onLocationChange={(location) => {
                setData((current) => ({
                  ...current,
                  address: location.address,
                  address_pinned: location.pinned,
                  address_lat: String(location.lat),
                  address_lng: String(location.lng),
                }));
                setErrors((current) => ({ ...current, address: undefined }));
              }}
            />
              {errors.address && <p className="mt-1 text-xs text-red-500">{errors.address}</p>}
            </div>

            <div className="mt-4 space-y-1.5">
              <Label htmlFor="notes">Additional Notes</Label>
              <Textarea
                id="notes"
                value={data.notes}
                onChange={(event) => setField("notes", event.target.value)}
                className="min-h-20 resize-none"
                placeholder="Access instructions, production details, measurements, or special requests."
              />
            </div>
          </section>

          <section className="rounded-lg border bg-card p-5 shadow-sm">
            <SectionTitle title="Schedule Work Job" description="Set the actual production slot and workers." />
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              <Field label="Work Job Date" error={errors.scheduled_date}>
                <Input type="date" min={today} value={data.scheduled_date} onChange={(event) => setField("scheduled_date", event.target.value)} />
              </Field>
                <Field label="Time From" error={errors.scheduled_time_from}>
                  <Input type="time" min={startTimeMin} value={data.scheduled_time_from} onChange={(event) => setField("scheduled_time_from", event.target.value)} />
                </Field>
                <Field label="Time Until" error={errors.scheduled_time_until}>
                  <Input type="time" min={data.scheduled_time_from || undefined} value={data.scheduled_time_until} onChange={(event) => setField("scheduled_time_until", event.target.value)} />
                </Field>
              </div>
            <div className="mt-4 space-y-2">
              <div className="flex items-center gap-2">
                <Users className="size-4 text-primary" />
                <Label>Assigned Workers</Label>
              </div>
              <WorkerMultiSelect
                workers={workers}
                value={data.worker_ids}
                onChange={(value) => setField("worker_ids", value)}
                label="Available Workers"
                error={errors.worker_ids}
              />
            </div>
          </section>

          <section className="rounded-lg border bg-card p-5 shadow-sm">
            <SectionTitle title="Fabrication Plan" description="Tell the customer what happens between approval and installation." />
            <div className="mt-4 rounded-lg border bg-muted/30 p-4">
              <label className="flex items-start gap-3">
                <Checkbox
                  checked={data.fabrication_status !== "not_required"}
                  onCheckedChange={(checked) => {
                    setField("fabrication_status", checked === true ? "pending" : "not_required");
                    if (checked !== true) {
                      setField("fabrication_expected_completion_date", "");
                      setField("fabrication_notes", "");
                    }
                  }}
                />
                <span>
                  <span className="block text-sm font-medium">This job includes fabrication</span>
                  <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">
                    Turn this off for repair, maintenance, or other services that go directly to scheduling.
                  </span>
                </span>
              </label>
              {data.fabrication_status !== "not_required" && (
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <Field label="Expected Completion" error={errors.fabrication_expected_completion_date}>
                    <Input
                      type="date"
                      min={today}
                      value={data.fabrication_expected_completion_date}
                      onChange={(event) => setField("fabrication_expected_completion_date", event.target.value)}
                    />
                  </Field>
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label htmlFor="fabrication_notes">Customer-visible update</Label>
                    <Textarea
                      id="fabrication_notes"
                      value={data.fabrication_notes}
                      onChange={(event) => setField("fabrication_notes", event.target.value)}
                      className="min-h-20 resize-none"
                      placeholder="Example: Materials confirmed; fabrication starts Monday."
                    />
                    {errors.fabrication_notes && <p className="text-xs font-medium text-destructive">{errors.fabrication_notes}</p>}
                  </div>
                </div>
              )}
            </div>
          </section>

          <section className="rounded-lg border bg-card p-5 shadow-sm">
            <SectionTitle title="Payment Terms" description="Down payment is optional for every work job." />
            <div className="mt-4 rounded-lg border bg-muted/30 p-4">
              <label className="flex items-start gap-3">
                <Checkbox
                  checked={data.is_down_payment_required}
                  onCheckedChange={(checked) => setField("is_down_payment_required", checked === true)}
                />
                <span>
                  <span className="block text-sm font-medium">Require down payment</span>
                  <span className="mt-1 block text-xs text-muted-foreground">
                    Leave this unchecked when the customer can proceed without a down payment.
                  </span>
                </span>
              </label>
              {data.is_down_payment_required && (
                <div className="mt-4 max-w-xs space-y-1.5">
                  <Label htmlFor="down_payment_percentage">Down Payment Percentage</Label>
                  <div className="relative">
                    <Percent className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <NumericInput
                      id="down_payment_percentage"
                      allowDecimal={false}
                      value={String(data.down_payment_percentage)}
                      onValueChange={(value) => setField("down_payment_percentage", Number(value || 0))}
                      className="pr-9"
                    />
                  </div>
                  {errors.down_payment_percentage && (
                    <p className="text-xs font-medium text-destructive">{errors.down_payment_percentage}</p>
                  )}
                </div>
              )}
            </div>
          </section>
        </div>

        <aside className="h-fit space-y-5">
          {attachedQuotation && <AdminQuotationDetails quotation={attachedQuotation} />}
          <div className="rounded-lg border bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-black">{isEditing ? "Update Work Job" : "Create Work Job"}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {isEditing ? "Review changes before saving." : "Review schedule, workers, and quotation before saving."}
                </p>
              </div>
              <Badge variant="outline">{isEditing ? workJob?.status ?? "pending" : "pending"}</Badge>
            </div>

            <div className="mt-4 space-y-2 rounded-lg border bg-muted/30 p-3 text-sm">
              <SummaryRow label="Date" value={data.scheduled_date || "-"} />
              <SummaryRow label="Time" value={`${data.scheduled_time_from || "-"} - ${data.scheduled_time_until || "-"}`} />
              <SummaryRow label="Workers" value={data.worker_ids.length ? `${data.worker_ids.length} assigned` : "None"} />
              <SummaryRow label="Quote Total" value={`₱${Number(quoteTotal).toLocaleString("en-PH")}`} />
              <SummaryRow
                label="Fabrication"
                value={data.fabrication_status === "not_required" ? "Not required" : "Required"}
              />
              {data.fabrication_status !== "not_required" && (
                <SummaryRow label="Fabrication ETA" value={data.fabrication_expected_completion_date || "Set date"} />
              )}
              <SummaryRow
                label="Down Payment"
                value={data.is_down_payment_required ? `₱${downPaymentAmount.toLocaleString("en-PH")}` : "Not required"}
              />
            </div>

            <Button type="submit" className="mt-5 h-11 w-full" disabled={saving}>
              {saving ? <Loader2 className="mr-2 size-4 animate-spin" /> : <BriefcaseBusiness className="mr-2 size-4" />}
              {saving ? (isEditing ? "Updating..." : "Creating...") : (isEditing ? "Update Work Job" : "Create Work Job")}
            </Button>
          </div>
        </aside>
      </form>

      <Sheet open={calendarOpen} onOpenChange={setCalendarOpen}>
        <SheetContent side="left" className="overflow-y-auto p-0 sm:max-w-none" style={{ width: "min(1180px, calc(100vw - 32px))", maxWidth: "none" }}>
          <SheetHeader className="border-b px-6 py-5 text-left">
            <SheetTitle>Calendar</SheetTitle>
            <SheetDescription>Appointments overview and workers schedule.</SheetDescription>
          </SheetHeader>
          <div className="px-6 py-6">
            <AdminAppointmentCalendar appointments={appointments} />
          </div>
        </SheetContent>
      </Sheet>

      <Sheet open={quotationOpen} onOpenChange={setQuotationOpen}>
        <SheetContent side="right" className="w-full overflow-y-auto p-6 sm:max-w-xl">
          <SheetHeader className="text-left">
            <SheetTitle>Quotation</SheetTitle>
            <SheetDescription>
              {attachedQuotation ? "Attached quotation for this work job." : "Create the quotation from an appointment before creating the work job."}
            </SheetDescription>
          </SheetHeader>
          <div className="mt-6">
            {attachedQuotation ? (
              <AdminQuotationDetails quotation={attachedQuotation} />
            ) : (
              <div className="rounded-lg border border-dashed bg-muted/30 p-5 text-sm text-muted-foreground">
                Work jobs should be created from a confirmed appointment when a quotation is available.
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{isEditing ? "Update this work job?" : "Create this work job?"}</AlertDialogTitle>
            <AlertDialogDescription>
              Please confirm the customer details, schedule, assigned workers, quotation, and payment terms before saving.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={saving}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={saving}
              onClick={(event) => {
                event.preventDefault();
                void saveWorkJob();
              }}
            >
              {saving ? (isEditing ? "Updating..." : "Creating...") : (isEditing ? "Update Work Job" : "Create Work Job")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function SectionTitle({ title, description }: { title: string; description: string }) {
  return (
    <div>
      <h2 className="text-xs font-semibold uppercase tracking-widest text-primary">{title}</h2>
      <p className="mt-1 text-xs text-muted-foreground">{description}</p>
    </div>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
      {error && <p className="text-xs font-medium text-destructive">{error}</p>}
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  );
}
