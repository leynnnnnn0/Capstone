"use client";

import { useEffect, useMemo, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { BriefcaseBusiness, CalendarDays, FileText, Loader2, Percent, Users } from "lucide-react";
import { z } from "zod";

import AdminAppointmentCalendar from "@/components/admin-appointments/AdminAppointmentCalendar";
import AdminQuotationDetails from "@/components/admin-appointments/AdminQuotationDetails";
import WorkerMultiSelect from "@/components/admin-appointments/WorkerMultiSelect";
import LocationPicker from "@/components/landing/LocationPicker";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  fetchAdminAppointment,
  fetchAdminAppointments,
} from "@/features/admin-appointments/admin-appointment-api";
import type { AdminAppointment, AdminWorker } from "@/features/admin-appointments/types";
import {
  createAdminWorkJob,
  fetchWorkJobWorkers,
} from "@/features/admin-work-jobs/admin-work-job-api";
import {
  emptyWorkJobForm,
  workJobFormFromAppointment,
} from "@/features/admin-work-jobs/admin-work-job-utils";
import type { AdminWorkJobForm as WorkJobFormValues } from "@/features/admin-work-jobs/types";

const workJobSchema = z.object({
  first_name: z.string().min(1, "First name is required."),
  last_name: z.string().min(1, "Last name is required."),
  phone_number: z.string().min(1, "Phone number is required."),
  email: z.string().email("Enter a valid email.").or(z.literal("")),
  address: z.string().min(1, "Address is required."),
  service_type: z.string().min(1, "Service type is required."),
  scheduled_date: z.string().min(1, "Scheduled date is required."),
  scheduled_time_from: z.string().min(1, "Start time is required."),
  scheduled_time_until: z.string().min(1, "End time is required."),
  worker_ids: z.array(z.number()).min(1, "Assign at least one worker."),
  is_down_payment_required: z.boolean(),
  down_payment_percentage: z.coerce.number().min(1).max(100),
}).refine((value) => value.scheduled_time_until > value.scheduled_time_from, {
  path: ["scheduled_time_until"],
  message: "End time must be after start time.",
});

const serviceOptions = [
  { value: "installation", label: "Installation" },
  { value: "repair", label: "Repair" },
  { value: "quotation", label: "Quotation" },
  { value: "other", label: "Other" },
];

type FormErrors = Partial<Record<keyof WorkJobFormValues, string>>;

export default function AdminWorkJobForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const appointmentId = searchParams.get("appointment");
  const [data, setData] = useState<WorkJobFormValues>(() => emptyWorkJobForm());
  const [workers, setWorkers] = useState<AdminWorker[]>([]);
  const [appointment, setAppointment] = useState<AdminAppointment | null>(null);
  const [appointments, setAppointments] = useState<AdminAppointment[]>([]);
  const [errors, setErrors] = useState<FormErrors>({});
  const [loadingAppointment, setLoadingAppointment] = useState(Boolean(appointmentId));
  const [saving, setSaving] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [quotationOpen, setQuotationOpen] = useState(false);

  useEffect(() => {
    fetchWorkJobWorkers().then((response) => setWorkers(response.data));
    fetchAdminAppointments({ per_page: "100" }).then((response) => setAppointments(response.data));
  }, []);

  useEffect(() => {
    if (!appointmentId) return;

    fetchAdminAppointment(appointmentId)
      .then((response) => {
        setAppointment(response.data);
        setData(workJobFormFromAppointment(response.data));
      })
      .finally(() => setLoadingAppointment(false));
  }, [appointmentId]);

  const sourceLabel = useMemo(() => {
    if (!appointment) return null;
    return `Prefilled from ${appointment.appointment_number}`;
  }, [appointment]);

  const quoteTotal = appointment?.quotation?.total ?? 0;
  const downPaymentAmount = data.is_down_payment_required
    ? Number(quoteTotal) * (Number(data.down_payment_percentage || 0) / 100)
    : 0;

  function setField<Key extends keyof WorkJobFormValues>(field: Key, value: WorkJobFormValues[Key]) {
    setData((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const parsed = workJobSchema.safeParse(data);
    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors;
      setErrors(Object.fromEntries(Object.entries(fieldErrors).map(([key, value]) => [key, value?.[0]])) as FormErrors);
      return;
    }

    setSaving(true);
    setErrors({});
    try {
      const response = await createAdminWorkJob(data);
      router.push(`/dashboard/work-jobs/${response.data.id}`);
    } catch (error) {
      if (error instanceof ApiError && error.errors) {
        setErrors(Object.fromEntries(Object.entries(error.errors).map(([key, value]) => [key, Array.isArray(value) ? value[0] : value])) as FormErrors);
      }
    } finally {
      setSaving(false);
    }
  }

  if (loadingAppointment) {
    return <p className="text-sm text-muted-foreground">Loading appointment details...</p>;
  }

  return (
    <>
    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-primary">Create Work Job</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight">New work job</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Create the work job, set the production slot, and attach the quotation.
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
            {appointment?.quotation ? "View Quotation" : "Create Quotation"}
          </Button>
        </div>
      </div>

      <form onSubmit={submit} className="mt-5 grid gap-5 xl:grid-cols-[1fr_380px]">
        <div className="space-y-5">
          <section className="rounded-lg border bg-card p-5 shadow-sm">
            <SectionTitle title="Customer Details" description="Basic contact and service information." />
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field label="First Name" error={errors.first_name}>
                <Input value={data.first_name} onChange={(event) => setField("first_name", event.target.value)} />
              </Field>
              <Field label="Last Name" error={errors.last_name}>
                <Input value={data.last_name} onChange={(event) => setField("last_name", event.target.value)} />
              </Field>
              <Field label="Phone Number" error={errors.phone_number}>
                <Input value={data.phone_number} onChange={(event) => setField("phone_number", event.target.value)} />
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
                <Input type="date" value={data.scheduled_date} onChange={(event) => setField("scheduled_date", event.target.value)} />
              </Field>
                <Field label="Time From" error={errors.scheduled_time_from}>
                  <Input type="time" value={data.scheduled_time_from} onChange={(event) => setField("scheduled_time_from", event.target.value)} />
                </Field>
                <Field label="Time Until" error={errors.scheduled_time_until}>
                  <Input type="time" value={data.scheduled_time_until} onChange={(event) => setField("scheduled_time_until", event.target.value)} />
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
            <SectionTitle title="Payment Terms" description="Choose whether the customer must pay a down payment before the job continues." />
            <div className="mt-4 rounded-lg border bg-muted/30 p-4">
              <label className="flex items-start gap-3">
                <Checkbox
                  checked={data.is_down_payment_required}
                  onCheckedChange={(checked) => setField("is_down_payment_required", checked === true)}
                />
                <span>
                  <span className="block text-sm font-medium">Require down payment</span>
                  <span className="mt-1 block text-xs text-muted-foreground">
                    The customer can still pay the full balance, but the remaining balance is blocked until the down payment is complete.
                  </span>
                </span>
              </label>
              {data.is_down_payment_required && (
                <div className="mt-4 max-w-xs space-y-1.5">
                  <Label htmlFor="down_payment_percentage">Down Payment Percentage</Label>
                  <div className="relative">
                    <Percent className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="down_payment_percentage"
                      type="number"
                      min={1}
                      max={100}
                      value={data.down_payment_percentage}
                      onChange={(event) => setField("down_payment_percentage", Number(event.target.value))}
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
          {appointment?.quotation && <AdminQuotationDetails quotation={appointment.quotation} />}
          <div className="rounded-lg border bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-black">Create Work Job</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Review schedule, workers, and quotation before saving.
                </p>
              </div>
              <Badge variant="outline">pending</Badge>
            </div>

            <div className="mt-4 space-y-2 rounded-lg border bg-muted/30 p-3 text-sm">
              <SummaryRow label="Date" value={data.scheduled_date || "-"} />
              <SummaryRow label="Time" value={`${data.scheduled_time_from || "-"} - ${data.scheduled_time_until || "-"}`} />
              <SummaryRow label="Workers" value={data.worker_ids.length ? `${data.worker_ids.length} assigned` : "None"} />
              <SummaryRow label="Quote Total" value={`₱${Number(quoteTotal).toLocaleString("en-PH")}`} />
              <SummaryRow
                label="Down Payment"
                value={data.is_down_payment_required ? `₱${downPaymentAmount.toLocaleString("en-PH")}` : "Not required"}
              />
            </div>

            <Button type="submit" className="mt-5 h-11 w-full" disabled={saving}>
              {saving ? <Loader2 className="mr-2 size-4 animate-spin" /> : <BriefcaseBusiness className="mr-2 size-4" />}
              {saving ? "Creating..." : "Create Work Job"}
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
              {appointment?.quotation ? "Attached quotation from the source appointment." : "Create the quotation from an appointment before creating the work job."}
            </SheetDescription>
          </SheetHeader>
          <div className="mt-6">
            {appointment?.quotation ? (
              <AdminQuotationDetails quotation={appointment.quotation} />
            ) : (
              <div className="rounded-lg border border-dashed bg-muted/30 p-5 text-sm text-muted-foreground">
                Work jobs should be created from a confirmed appointment when a quotation is available.
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
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
