"use client";

import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CalendarDays, Calculator, CheckCircle2, Download, FileText, Images, Layers, Loader2, Package, Plus, StickyNote, Users } from "lucide-react";

import AdminAppointmentCalendar from "@/components/admin-appointments/AdminAppointmentCalendar";
import AdminQuotationLineItemRow from "@/components/admin-appointments/AdminQuotationLineItemRow";
import WorkerMultiSelect from "@/components/admin-appointments/WorkerMultiSelect";
import FormSelect from "@/components/form/FormSelect";
import LocationPicker from "@/components/landing/LocationPicker";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import {
  createAdminAppointment,
  fetchAdminAppointment,
  fetchAdminAppointments,
  fetchAvailableWorkers,
  fetchWorkers,
  updateAdminAppointment,
} from "@/features/admin-appointments/admin-appointment-api";
import {
  adminStatusMeta,
  adminServiceOptions,
  createAdminAppointmentForm,
} from "@/features/admin-appointments/admin-appointment-utils";
import {
  fmtPeso,
  customerItemToLineItem,
  lineItemToPayload,
  makeAdminLineItem,
  validateLineItems,
  type AdminLineItem,
} from "@/features/admin-appointments/admin-quotation-line-utils";
import type { AdminAppointment, AdminAppointmentForm as AdminAppointmentFormState, AdminWorker } from "@/features/admin-appointments/types";
import { fetchProducts } from "@/features/products/product-api";
import type { Product } from "@/features/products/types";
import { ApiError } from "@/lib/api";

type FieldErrors = Partial<Record<keyof AdminAppointmentFormState | "items" | "form", string>>;

const statusOptions = [
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "rescheduled", label: "Rescheduled" },
  { value: "on_the_way", label: "On the Way" },
  { value: "in_progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
  { value: "reopened", label: "Reopened" },
  { value: "no_show", label: "No Show" },
] as const;

export default function AdminAppointmentForm({ appointmentId }: { appointmentId?: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rebookId = searchParams.get("rebook");
  const isEdit = Boolean(appointmentId);
  const [data, setData] = useState<AdminAppointmentFormState>(() => createAdminAppointmentForm());
  const [errors, setErrors] = useState<FieldErrors>({});
  const [saving, setSaving] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [availableWorkers, setAvailableWorkers] = useState<AdminWorker[]>([]);
  const [appointments, setAppointments] = useState<AdminAppointment[]>([]);
  const [items, setItems] = useState<AdminLineItem[]>([]);
  const [hasQuotation, setHasQuotation] = useState(false);
  const [quotationOpen, setQuotationOpen] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const grandTotal = useMemo(() => items.reduce((sum, item) => sum + Number(item.total_amount || 0), 0), [items]);

  useEffect(() => {
    Promise.all([
      fetchProducts({ is_active: "1", per_page: "100" }),
      fetchWorkers(),
      fetchAdminAppointments({ per_page: "100" }),
      appointmentId ? fetchAdminAppointment(appointmentId) : rebookId ? fetchAdminAppointment(rebookId) : Promise.resolve(null),
    ])
      .then(([productResponse, workerResponse, appointmentResponse, rebookResponse]) => {
        setProducts(productResponse.data);
        setAvailableWorkers(workerResponse.data);
        setAppointments(appointmentResponse.data);
        if (rebookResponse) {
          const source = rebookResponse.data;
          setData({
            first_name: source.first_name,
            last_name: source.last_name,
            phone_number: source.phone_number,
            email: source.email ?? "",
            address: source.address,
            address_pinned: source.address_pinned ?? "",
            address_lat: source.address_lat ?? "",
            address_lng: source.address_lng ?? "",
            preferred_date: source.appointment_date ?? source.preferred_date,
            preferred_time: source.preferred_time,
            service_type: source.service_type,
            service_type_other: source.service_type_other ?? "",
            additional_notes: source.additional_notes ?? "",
            consent: true,
            status: appointmentId ? source.status : "pending",
            appointment_date: source.appointment_date ?? source.preferred_date,
            appointment_time_from: source.appointment_time_from ?? "09:00",
            appointment_time_until: source.appointment_time_until ?? "11:00",
            worker_ids: source.workers.map((worker) => worker.id),
            quotation_notes: source.quotation?.notes ?? "",
          });
          if (source.quotation?.items.length) {
            setItems(source.quotation.items.map(customerItemToLineItem));
            setHasQuotation(true);
          }
        }
      })
      .finally(() => setLoading(false));
  }, [appointmentId, rebookId]);

  useEffect(() => {
    if (!data.appointment_date || !data.appointment_time_from || !data.appointment_time_until) return;

    fetchAvailableWorkers({
      appointment_date: data.appointment_date,
      appointment_time_from: data.appointment_time_from,
      appointment_time_until: data.appointment_time_until,
      worker_ids: data.worker_ids,
    })
      .then((response) => setAvailableWorkers(response.data))
      .catch(() => undefined);
  }, [data.appointment_date, data.appointment_time_from, data.appointment_time_until, data.worker_ids]);

  function setField<K extends keyof AdminAppointmentFormState>(field: K, value: AdminAppointmentFormState[K]) {
    setData((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined, form: undefined }));
  }

  function updateItem(id: string, updates: Partial<AdminLineItem>) {
    setItems((current) => current.map((item) => (item.id === id ? { ...item, ...updates } : item)));
    setErrors((current) => ({ ...current, items: undefined, form: undefined }));
  }

  function startQuotation() {
    setItems((current) => current.length ? current : [makeAdminLineItem()]);
    setField("service_type", "quotation");
    setQuotationOpen(true);
  }

  function saveQuotationDraft() {
    const quoteErrors = validateLineItems(items);
    if (Object.keys(quoteErrors).length > 0) {
      setErrors(quoteErrors as FieldErrors);
      return;
    }

    setHasQuotation(true);
    setField("service_type", "quotation");
    setQuotationOpen(false);
  }

  function resetQuotationDraft() {
    setItems(hasQuotation ? items : [makeAdminLineItem()]);
    setErrors((current) => ({ ...current, items: undefined, form: undefined }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setErrors({});

    const quoteErrors = hasQuotation ? validateLineItems(items) : {};
    if (Object.keys(quoteErrors).length > 0) {
      setErrors(quoteErrors as FieldErrors);
      setSaving(false);
      return;
    }

    try {
      const payload: AdminAppointmentFormState = {
        ...data,
        preferred_date: data.appointment_date,
        preferred_time: data.appointment_time_from < "12:00" ? "morning" : "afternoon",
        ...(hasQuotation ? { items: items.map(lineItemToPayload) } : {}),
      };
      const response = appointmentId
        ? await updateAdminAppointment(appointmentId, payload)
        : await createAdminAppointment(payload);
      router.push(`/dashboard/appointments/${response.data.id}`);
    } catch (error) {
      setErrors(toFieldErrors(error));
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-primary">
            {appointmentId ? "Edit Appointment" : rebookId ? "Rebook Appointment" : "Create Appointment"}
          </p>
          <h1 className="mt-2 text-3xl font-black tracking-tight">
            {appointmentId ? "Edit appointment" : rebookId ? "New appointment from cancelled booking" : "New appointment"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {rebookId
              ? "Review the copied details, set the new slot, and save it as a separate appointment."
              : appointmentId
                ? "Update the appointment details, schedule, workers, and quotation."
              : "Create the appointment, set the slot, and attach a quotation when needed."}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => setCalendarOpen(true)}
          >
            <CalendarDays className="size-3.5" />
            Open Calendar
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={
              hasQuotation ? () => setQuotationOpen(true) : startQuotation
            }
          >
            <FileText className="size-3.5" />
            {hasQuotation ? "Edit Quotation" : "Create Quotation"}
          </Button>
        </div>
      </div>

      <form onSubmit={submit} className="grid gap-5 xl:grid-cols-[1fr_380px]">
        <div className="space-y-5">
          <section className="rounded-lg border bg-card p-5 shadow-sm">
            <SectionTitle
              title="Customer Details"
              description="Basic contact and service information."
            />
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <TextField
                label="First Name"
                value={data.first_name}
                error={errors.first_name}
                onChange={(value) => setField("first_name", value)}
              />
              <TextField
                label="Last Name"
                value={data.last_name}
                error={errors.last_name}
                onChange={(value) => setField("last_name", value)}
              />
              <TextField
                label="Phone Number"
                value={data.phone_number}
                error={errors.phone_number}
                onChange={(value) => setField("phone_number", value)}
              />
              <TextField
                label="Email"
                type="email"
                value={data.email}
                error={errors.email}
                onChange={(value) => setField("email", value)}
              />
            </div>

            <div className="mt-4">
              <Label className="mb-1.5 block">Service Address</Label>
              <LocationPicker
                error={errors.address}
                initialValue={{
                  address: data.address,
                  pinned: data.address_pinned,
                  lat: data.address_lat ? Number(data.address_lat) : null,
                  lng: data.address_lng ? Number(data.address_lng) : null,
                }}
                onLocationChange={({ address, pinned, lat, lng }) => {
                  setData((current) => ({
                    ...current,
                    address,
                    address_pinned: pinned,
                    address_lat: lat ? lat.toFixed(6) : "",
                    address_lng: lng ? lng.toFixed(6) : "",
                  }));
                  setErrors((current) => ({
                    ...current,
                    address: undefined,
                    form: undefined,
                  }));
                }}
              />
              {errors.address && (
                <p className="mt-1 text-xs text-red-500">{errors.address}</p>
              )}
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <FormSelect
                id="service_type"
                label="Service Type"
                value={data.service_type}
                options={adminServiceOptions.filter(
                  (option) => option.value !== "all",
                )}
                error={errors.service_type}
                onValueChange={(value) => setField("service_type", value)}
              />
              {isEdit ? (
                <div className="space-y-1.5">
                  <Label>Status</Label>
                  <div className="flex h-10 items-center rounded-md border bg-muted/30 px-3">
                    <Badge variant="outline" className={adminStatusMeta[data.status]?.className}>
                      {adminStatusMeta[data.status]?.label ?? data.status}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-muted-foreground">Use the status actions on the appointment page for workflow changes.</p>
                </div>
              ) : (
                <FormSelect
                  id="status"
                  label="Status"
                  value={data.status}
                  options={statusOptions.filter((option) => ["pending", "confirmed"].includes(option.value))}
                  error={errors.status}
                  onValueChange={(value) => setField("status", value)}
                />
              )}
              {data.service_type === "other" && (
                <TextField
                  label="Describe Service"
                  value={data.service_type_other}
                  error={errors.service_type_other}
                  onChange={(value) => setField("service_type_other", value)}
                />
              )}
            </div>

            <div className="mt-4 space-y-1.5">
              <Label htmlFor="additional_notes">Additional Notes</Label>
              <Textarea
                id="additional_notes"
                rows={3}
                value={data.additional_notes}
                onChange={(event) =>
                  setField("additional_notes", event.target.value)
                }
                className="resize-none"
                placeholder="Access instructions, preferred details, measurements, or special requests."
              />
              {errors.additional_notes && (
                <p className="text-xs text-red-500">
                  {errors.additional_notes}
                </p>
              )}
            </div>
          </section>

          <section className="rounded-lg border bg-card p-5 shadow-sm">
            <SectionTitle
              title="Schedule Appointment"
              description="Set the actual inspection slot and workers."
            />
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              <TextField
                label="Appointment Date"
                type="date"
                value={data.appointment_date}
                error={errors.appointment_date}
                onChange={(value) => setField("appointment_date", value)}
              />
              <TextField
                label="Time From"
                type="time"
                value={data.appointment_time_from}
                error={errors.appointment_time_from}
                onChange={(value) => setField("appointment_time_from", value)}
              />
              <TextField
                label="Time Until"
                type="time"
                value={data.appointment_time_until}
                error={errors.appointment_time_until}
                onChange={(value) => setField("appointment_time_until", value)}
              />
            </div>

            <div className="mt-4 space-y-2">
              <div className="flex items-center gap-2">
                <Users className="size-4 text-primary" />
                <Label>Assigned Workers</Label>
              </div>
              <WorkerMultiSelect
                workers={availableWorkers}
                value={data.worker_ids}
                onChange={(value) => setField("worker_ids", value)}
                label="Available Workers"
                error={errors.worker_ids}
              />
            </div>
          </section>
        </div>

        <aside className="h-fit space-y-5">
          {hasQuotation && (
            <DraftQuotationSummary
              items={items}
              notes={data.quotation_notes ?? ""}
            />
          )}
          <div className="rounded-lg border bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-black">{appointmentId ? "Update Appointment" : "Create Appointment"}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Review schedule, status, and quotation before saving.
                </p>
              </div>
              <Badge
                variant={data.status === "confirmed" ? "default" : "outline"}
              >
                {data.status}
              </Badge>
            </div>

            <div className="mt-4 space-y-2 rounded-lg border bg-muted/30 p-3 text-sm">
              <SummaryRow label="Date" value={data.appointment_date || "-"} />
              <SummaryRow
                label="Time"
                value={`${data.appointment_time_from || "-"} - ${data.appointment_time_until || "-"}`}
              />
              <SummaryRow
                label="Workers"
                value={
                  data.worker_ids.length
                    ? `${data.worker_ids.length} assigned`
                    : "None"
                }
              />
              <SummaryRow
                label="Quote Total"
                value={`₱${fmtPeso(grandTotal)}`}
              />
            </div>

            {errors.form && (
              <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
                {errors.form}
              </p>
            )}
            <Button
              type="submit"
              className="mt-5 h-11 w-full"
              disabled={saving}
            >
                {saving ? (appointmentId ? "Updating..." : "Creating...") : appointmentId ? "Update Appointment" : "Create Appointment"}
              </Button>
          </div>
        </aside>
      </form>

      <Sheet open={calendarOpen} onOpenChange={setCalendarOpen}>
        <SheetContent
          side="left"
          className="overflow-y-auto p-0 sm:max-w-none"
          style={{ width: "min(1180px, calc(100vw - 32px))", maxWidth: "none" }}
        >
          <SheetHeader className="border-b px-6 py-5 text-left">
            <SheetTitle>Calendar</SheetTitle>
            <SheetDescription>
              Appointments overview and workers schedule.
            </SheetDescription>
          </SheetHeader>
          <div className="px-6 py-6">
            <AdminAppointmentCalendar appointments={appointments} />
          </div>
        </SheetContent>
      </Sheet>

      <Sheet open={quotationOpen} onOpenChange={setQuotationOpen}>
        <SheetContent
          side="bottom"
          className="h-[86vh] overflow-hidden rounded-t-xl p-0 sm:max-w-none"
        >
          <SheetHeader className="border-b px-6 py-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <SheetTitle className="flex items-center gap-2">
                  <FileText className="size-4 text-primary" />
                  {hasQuotation ? "Edit Quotation" : "Create Quotation"}
                </SheetTitle>
                <SheetDescription>
                  Add line items, materials, dimensions, and pricing.
                </SheetDescription>
              </div>
              {grandTotal > 0 && (
                <div className="pr-12 text-right">
                  <p className="text-xs text-muted-foreground">Grand Total</p>
                  <p className="text-lg font-bold text-primary">
                    ₱{fmtPeso(grandTotal)}
                  </p>
                </div>
              )}
            </div>
          </SheetHeader>

          <div className="h-[calc(86vh-145px)] space-y-5 overflow-y-auto px-6 py-5">
            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-xs font-semibold">
                <StickyNote className="size-3.5" />
                Quotation Notes
              </label>
              <Textarea
                placeholder="Payment terms, delivery, warranty..."
                rows={2}
                value={data.quotation_notes ?? ""}
                onChange={(event) =>
                  setField("quotation_notes", event.target.value)
                }
                className="resize-none"
              />
            </div>

            <Separator />

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Package className="size-4 text-primary" />
                  <span className="text-sm font-semibold">Line Items</span>
                  <Badge variant="outline">
                    {items.length} item{items.length === 1 ? "" : "s"}
                  </Badge>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setItems((current) => [...current, makeAdminLineItem()])
                  }
                >
                  <Plus className="mr-1.5 size-3.5" />
                  Add Item
                </Button>
              </div>

              {errors.items && (
                <p className="text-xs text-destructive">{errors.items}</p>
              )}

              {loading ? (
                <div className="rounded-lg border bg-muted/40 p-5 text-sm text-muted-foreground">
                  <Loader2 className="mr-2 inline size-4 animate-spin" />
                  Loading quotation editor...
                </div>
              ) : (
                <div className="space-y-3">
                  {items.map((item, index) => (
                    <AdminQuotationLineItemRow
                      key={item.id}
                      item={item}
                      index={index}
                      products={products}
                      errors={errors as Record<string, string>}
                      onUpdate={updateItem}
                      onRemove={(id) =>
                        setItems((current) =>
                          current.filter((lineItem) => lineItem.id !== id),
                        )
                      }
                    />
                  ))}
                </div>
              )}
            </div>

            <PriceSummary items={items} />
          </div>

          <SheetFooter className="flex-row items-center justify-between border-t bg-background px-6 py-4">
            <Button type="button" variant="ghost" onClick={resetQuotationDraft}>
              Reset
            </Button>
            <div className="ml-auto flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setQuotationOpen(false)}
              >
                Cancel
              </Button>
              <Button type="button" onClick={saveQuotationDraft}>
                {hasQuotation ? "Update Quotation" : "Create Quotation"}
              </Button>
            </div>
          </SheetFooter>
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

function PriceSummary({ items }: { items: AdminLineItem[] }) {
  const grandTotal = items.reduce((sum, item) => sum + Number(item.total_amount || 0), 0);

  return (
    <div className="rounded-lg border bg-muted/40 p-4">
      <div className="mb-3 flex items-center gap-2">
        <Package className="size-4 text-primary" />
        <span className="text-sm font-semibold">Price Summary</span>
      </div>
      <div className="space-y-1.5">
        {items.map((item, index) => Number(item.total_amount) > 0 ? (
          <div key={item.id} className="flex justify-between text-sm">
            <span className="truncate text-muted-foreground">{index + 1}. {item.name || "Unnamed item"}</span>
            <span className="ml-2 shrink-0 font-medium">₱{fmtPeso(item.total_amount)}</span>
          </div>
        ) : null)}
        <Separator className="my-2" />
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold">Grand Total</span>
          <span className="text-lg font-bold text-primary">₱{fmtPeso(grandTotal)}</span>
        </div>
      </div>
    </div>
  );
}

function DraftQuotationSummary({ items, notes }: { items: AdminLineItem[]; notes: string }) {
  const subtotal = items.reduce((sum, item) => sum + Number(item.total_amount || 0), 0);

  return (
    <div className="rounded-lg border bg-card p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-base font-black">
            <FileText className="h-4 w-4 text-primary" />
            Quotation
          </h2>
          <p className="mt-3 text-xs text-muted-foreground">Created {formatToday()}</p>
        </div>
        <div className="flex items-center gap-1.5">
          <Button type="button" variant="outline" size="sm" className="h-7 gap-1.5 text-xs" disabled>
            <Download className="h-3 w-3" />
            PDF
          </Button>
          <Badge className="bg-green-600 text-[10px] text-white hover:bg-green-700">
            {items.length} approved
          </Badge>
          <Badge variant="outline" className="text-xs">
            {items.length} item{items.length === 1 ? "" : "s"}
          </Badge>
        </div>
      </div>

      {notes && (
        <div className="mt-4 rounded-lg bg-muted/40 p-3">
          <div className="mb-1.5 flex items-center gap-1.5">
            <StickyNote className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground">Notes</span>
          </div>
          <p className="text-sm">{notes}</p>
        </div>
      )}

      <div className="mt-4 space-y-3">
        {items.map((item, index) => <DraftQuotationItem key={item.id} item={item} index={index} />)}
      </div>

      <Separator className="my-4" />

      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>All items subtotal</span>
          <span>₱{fmtPeso(subtotal)}</span>
        </div>
        <div className="flex items-center justify-between rounded-lg bg-green-50 px-3 py-2 dark:bg-green-950/20">
          <div className="flex items-center gap-1.5">
            <Calculator className="h-4 w-4" />
            <span className="text-sm font-semibold">Approved Total</span>
            <span className="text-[10px] text-green-600 dark:text-green-500">({items.length} of {items.length} items)</span>
          </div>
          <span className="text-xl font-bold text-green-700 dark:text-green-400">₱{fmtPeso(subtotal)}</span>
        </div>
      </div>
    </div>
  );
}

function DraftQuotationItem({ item, index }: { item: AdminLineItem; index: number }) {
  return (
    <div className="rounded-lg border transition-colors">
      <div className="flex items-start justify-between px-3 py-2.5">
        <div className="flex items-start gap-2.5">
          <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-green-100 text-[10px] font-bold text-green-700 dark:bg-green-900 dark:text-green-300">
            {index + 1}
          </div>
          <div>
            <p className="text-sm leading-tight font-semibold">{item.name || "Unnamed item"}</p>
            {item.description && <p className="mt-0.5 text-xs text-muted-foreground">{item.description}</p>}
            <div className="mt-1 flex flex-wrap gap-1.5">
              {(item.width || item.height) && <Badge variant="outline" className="text-[10px]">{item.width || 0} x {item.height || 0} cm</Badge>}
              {item.thickness && <Badge variant="outline" className="text-[10px]">{item.thickness} mm</Badge>}
              <Badge variant="outline" className="text-[10px]">{item.pieces || 1} pc{Number(item.pieces || 1) !== 1 ? "s" : ""}</Badge>
            </div>
          </div>
        </div>
        <div className="ml-2 shrink-0 text-right">
          <p className="text-sm font-bold text-green-700 dark:text-green-400">₱{fmtPeso(item.total_amount)}</p>
          {Number(item.pieces || 1) > 1 && <p className="text-[10px] text-muted-foreground">₱{fmtPeso(item.amount_per_piece)} x {item.pieces}</p>}
        </div>
      </div>

      <div className="flex items-center justify-between border-t bg-muted/20 px-3 py-2">
        <div className="inline-flex h-7 items-center gap-1.5 rounded-lg border border-dashed bg-background px-3 text-[11px]">
          <CheckCircle2 className="h-3.5 w-3.5 text-muted-foreground" />
          Approved
        </div>
        <Button type="button" variant="ghost" size="sm" className="h-7 gap-1.5 text-[11px] text-muted-foreground hover:text-foreground" disabled>
          <Images className="h-3.5 w-3.5" />
          Photos
        </Button>
      </div>

      {item.selected_options.length > 0 && (
        <div className="border-t px-3 py-2">
          <div className="mb-1.5 flex items-center gap-1">
            <Layers className="h-3 w-3 text-muted-foreground" />
            <span className="text-[10px] font-medium tracking-wide text-muted-foreground uppercase">Material Options</span>
          </div>
          <div className="space-y-1">
            {item.selected_options.map((option) => (
              <div key={`${item.id}-${option.product_option_group_id}`} className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-muted-foreground">{option.group_name}:</span>
                  <span className="text-xs font-medium">{option.option_name}</span>
                </div>
                {Number(option.price_modifier) > 0 ? (
                  <span className="text-xs font-medium text-green-600">+₱{fmtPeso(option.price_modifier)}</span>
                ) : (
                  <span className="text-xs text-muted-foreground">Included</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {Number(item.options_amount) > 0 && (
        <div className="border-t bg-muted/30 px-3 py-2">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Base price</span>
            <span>₱{fmtPeso(item.amount_per_piece)}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Options</span>
            <span className="text-green-600">+₱{fmtPeso(item.options_amount)}</span>
          </div>
        </div>
      )}

      {item.notes && (
        <div className="border-t px-3 py-2">
          <p className="text-xs text-muted-foreground italic">{item.notes}</p>
        </div>
      )}
    </div>
  );
}

function formatToday() {
  return new Intl.DateTimeFormat("en-PH", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date());
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  );
}

function TextField({ label, type = "text", value, error, onChange }: { label: string; type?: string; value: string; error?: string; onChange: (value: string) => void }) {
  const id = label.toLowerCase().replaceAll(" ", "_");

  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} type={type} value={value} onChange={(event) => onChange(event.target.value)} />
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

function toFieldErrors(error: unknown): FieldErrors {
  if (!(error instanceof ApiError)) return { form: "Unable to create appointment. Please try again." };
  if (!error.errors) return { form: error.message };

  return Object.entries(error.errors).reduce<FieldErrors>((acc, [field, value]) => {
    acc[field as keyof FieldErrors] = Array.isArray(value) ? value[0] : value;
    return acc;
  }, {});
}
