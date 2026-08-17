"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BriefcaseBusiness, CalendarClock, RotateCcw, Pencil, XCircle } from "lucide-react";

import AppointmentInfoCard from "@/components/customer/appointments/AppointmentInfoCard";
import AppointmentMeasurementRecords from "@/components/ar-measurements/AppointmentMeasurementRecords";
import CustomerOrderNextStepCard from "@/components/customer/appointments/CustomerOrderNextStepCard";
import CustomerActivityLog from "@/components/customer/shared/CustomerActivityLog";
import CustomerContactLocationSheet from "@/components/customer/shared/CustomerContactLocationSheet";
import CustomerQuoteSummary from "@/components/customer/shared/CustomerQuoteSummary";
import CustomerStatusBadge from "@/components/customer/shared/CustomerStatusBadge";
import { CustomerStatus, statusIn } from "@/features/customer/status";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DetailPageSkeleton } from "@/components/ui/page-skeletons";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  cancelCustomerAppointment,
  getCustomerAppointment,
  rescheduleCustomerAppointment,
} from "@/features/customer/customer-api";
import type { CustomerAppointment } from "@/features/customer/types";
import { todayIsoDate, timeToMinutes } from "@/features/forms/validation";
import { useRealtimeRefresh } from "@/hooks/use-realtime";
import { ApiError } from "@/lib/api";
import { toast } from "sonner";

type RescheduleForm = {
  appointment_date: string;
  appointment_time_from: string;
  appointment_time_until: string;
  reason: string;
};

export default function AppointmentDetailPage({ appointmentId }: { appointmentId: string }) {
  const router = useRouter();
  const [appointment, setAppointment] = useState<CustomerAppointment | null>(null);
  const [reason, setReason] = useState("");
  const [cancelling, setCancelling] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelError, setCancelError] = useState("");
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [rescheduling, setRescheduling] = useState(false);
  const [rescheduleError, setRescheduleError] = useState("");
  const [rescheduleForm, setRescheduleForm] = useState<RescheduleForm>({
    appointment_date: "",
    appointment_time_from: "",
    appointment_time_until: "",
    reason: "",
  });

  const reload = useCallback(() => {
    getCustomerAppointment(appointmentId).then((response) => setAppointment(response.data));
  }, [appointmentId]);

  useEffect(() => {
    reload();
  }, [reload]);

  useRealtimeRefresh((payload) => {
    if (payload.id === Number(appointmentId) || payload.appointment_id === Number(appointmentId)) {
      reload();
    }
  }, ["appointment", "quotation"]);

  async function cancelAppointment() {
    if (!appointment || !reason.trim()) return;

    try {
      setCancelling(true);
      setCancelError("");
      const response = await cancelCustomerAppointment(appointment.id, reason);
      setAppointment({
        ...response.data,
        status: CustomerStatus.Cancelled,
        status_label: "Cancelled",
        can_edit: false,
        can_cancel: false,
      });
      setReason("");
      setCancelOpen(false);
      toast.success("Appointment Cancelled");
    } catch {
      try {
        const latest = await getCustomerAppointment(appointment.id);

        if (latest.data.status === CustomerStatus.Cancelled) {
          setAppointment({
            ...latest.data,
            can_edit: false,
            can_cancel: false,
          });
          setReason("");
          setCancelOpen(false);
          return;
        }
      } catch {
        // Keep the original cancellation error below.
      }

      setCancelError("We could not cancel this appointment. Please try again.");
    } finally {
      setCancelling(false);
    }
  }

  function seedRescheduleForm(nextAppointment = appointment) {
    if (!nextAppointment) return;

    setRescheduleForm({
      appointment_date: nextAppointment.appointment_date ?? nextAppointment.preferred_date,
      appointment_time_from: nextAppointment.appointment_time_from ?? "09:00",
      appointment_time_until: nextAppointment.appointment_time_until ?? "11:00",
      reason: "",
    });
    setRescheduleError("");
  }

  function updateRescheduleField<K extends keyof RescheduleForm>(field: K, value: RescheduleForm[K]) {
    setRescheduleForm((current) => ({ ...current, [field]: value }));
    setRescheduleError("");
  }

  function validateRescheduleForm() {
    const today = todayIsoDate();
    const startMinutes = timeToMinutes(rescheduleForm.appointment_time_from);
    const endMinutes = timeToMinutes(rescheduleForm.appointment_time_until);

    if (!rescheduleForm.appointment_date) return "Choose a new appointment date.";
    if (rescheduleForm.appointment_date < today) return "Appointment date cannot be before today.";
    if (startMinutes === null) return "Enter a valid start time.";
    if (endMinutes === null) return "Enter a valid end time.";
    if (endMinutes <= startMinutes) return "End time must be after the start time.";
    if (rescheduleForm.appointment_date === today) {
      const now = new Date();
      const nowMinutes = now.getHours() * 60 + now.getMinutes();
      if (startMinutes <= nowMinutes) return "Start time must be later than the current time.";
    }
    if (!rescheduleForm.reason.trim()) return "Please provide a reason for rescheduling.";

    return "";
  }

  async function rescheduleAppointment() {
    if (!appointment) return;

    const validationError = validateRescheduleForm();
    if (validationError) {
      setRescheduleError(validationError);
      return;
    }

    try {
      setRescheduling(true);
      setRescheduleError("");
      const response = await rescheduleCustomerAppointment(appointment.id, {
        ...rescheduleForm,
        reason: rescheduleForm.reason.trim(),
      });
      setAppointment(response.data);
      setRescheduleOpen(false);
      toast.success("Appointment rescheduled");
    } catch (error) {
      setRescheduleError(
        error instanceof ApiError
          ? error.message
          : "We could not reschedule this appointment. Please try again.",
      );
    } finally {
      setRescheduling(false);
    }
  }

  if (!appointment) {
    return <DetailPageSkeleton customer />;
  }

  const quotationCanBeSigned =
    !statusIn(appointment.status, [CustomerStatus.Cancelled, CustomerStatus.NoShow, CustomerStatus.Completed]) &&
    !statusIn(appointment.work_job?.status, [CustomerStatus.Cancelled, CustomerStatus.NoShow, CustomerStatus.Completed]);
  const quotationCanBeDownloaded =
    !statusIn(appointment.status, [CustomerStatus.Cancelled, CustomerStatus.NoShow]) &&
    !statusIn(appointment.work_job?.status, [CustomerStatus.Cancelled, CustomerStatus.NoShow]);

  return (
    <>
      <div className="relative mb-6 flex flex-col gap-6 overflow-hidden rounded-[1.75rem] bg-[#162d4a] px-5 py-8 text-white sm:px-8 lg:flex-row lg:items-end lg:justify-between lg:px-10">
        <div className="absolute -right-20 -top-24 h-64 w-64 rounded-full bg-[#608db9]/25 blur-3xl" />
        <div>
          <button
            onClick={() => router.back()}
            className="relative mb-4 text-xs font-semibold text-white/55 hover:text-white"
          >
            Back
          </button>
          <p className="relative text-[10px] font-bold uppercase tracking-[0.2em] text-[#c8dae8]">
            {appointment.appointment_number}
          </p>
          <h1 className="relative mt-2 text-3xl font-medium tracking-[-0.04em] text-white sm:text-4xl">
            Appointment details
          </h1>
        </div>
        <div className="relative flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
          <CustomerStatusBadge status={appointment.status} />
          <CustomerContactLocationSheet
            fullName={appointment.full_name}
            phoneNumber={appointment.phone_number}
            email={appointment.email}
            address={appointment.address}
            addressLat={appointment.address_lat}
            addressLng={appointment.address_lng}
          />
          <div className="flex flex-wrap gap-2">
            {appointment.status === "cancelled" ? (
              <Button
                asChild
                type="button"
                variant="outline"
                className="h-10 gap-2"
              >
                <Link
                  href={`/account/appointments/new?rebook=${appointment.id}`}
                >
                  <RotateCcw className="size-4" />
                  Rebook Appointment
                </Link>
              </Button>
            ) : appointment.can_edit ? (
              <Button
                asChild
                type="button"
                variant="outline"
                className="h-10 gap-2"
              >
                <Link href={`/account/appointments/${appointment.id}/edit`}>
                  <Pencil className="size-4" />
                  Edit Appointment
                </Link>
              </Button>
            ) : null}
            {appointment.can_reschedule && (
              <Dialog
                open={rescheduleOpen}
                onOpenChange={(open) => {
                  if (open) seedRescheduleForm();
                  setRescheduleOpen(open);
                }}
              >
                <DialogTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-10 gap-2"
                  >
                    <CalendarClock className="size-4" />
                    Reschedule
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Reschedule appointment</DialogTitle>
                    <DialogDescription>
                      Choose a new inspection schedule and tell SOG why you need
                      the change.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="space-y-1.5 sm:col-span-3">
                      <Label htmlFor="reschedule-date">New date</Label>
                      <Input
                        id="reschedule-date"
                        type="date"
                        min={todayIsoDate()}
                        value={rescheduleForm.appointment_date}
                        onChange={(event) => updateRescheduleField("appointment_date", event.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="reschedule-from">Time from</Label>
                      <Input
                        id="reschedule-from"
                        type="time"
                        value={rescheduleForm.appointment_time_from}
                        onChange={(event) => updateRescheduleField("appointment_time_from", event.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="reschedule-until">Time until</Label>
                      <Input
                        id="reschedule-until"
                        type="time"
                        value={rescheduleForm.appointment_time_until}
                        onChange={(event) => updateRescheduleField("appointment_time_until", event.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5 sm:col-span-3">
                      <Label htmlFor="reschedule-reason">Reason</Label>
                      <Textarea
                        id="reschedule-reason"
                        value={rescheduleForm.reason}
                        onChange={(event) => updateRescheduleField("reason", event.target.value)}
                        placeholder="Reason for rescheduling"
                        className="min-h-24 resize-none"
                      />
                    </div>
                    {rescheduleError && (
                      <p className="text-sm font-medium text-red-600 sm:col-span-3">
                        {rescheduleError}
                      </p>
                    )}
                  </div>
                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setRescheduleOpen(false)}
                      disabled={rescheduling}
                    >
                      Keep Current Schedule
                    </Button>
                    <Button
                      type="button"
                      disabled={rescheduling}
                      onClick={rescheduleAppointment}
                    >
                      {rescheduling ? "Rescheduling..." : "Confirm Reschedule"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
            {(appointment.status === "pending" ||
              appointment.status === "confirmed" ||
              appointment.status === "rescheduled") &&
              appointment.can_cancel && (
                <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
                  <DialogTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      className="h-10 gap-2 border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800"
                    >
                      <XCircle className="size-4" />
                      Cancel Appointment
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Cancel appointment?</DialogTitle>
                      <DialogDescription>
                        Please tell us why you want to cancel. This keeps the
                        team informed and helps with follow-up.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-2">
                      <Textarea
                        value={reason}
                        onChange={(event) => {
                          setReason(event.target.value);
                          setCancelError("");
                        }}
                        placeholder="Reason for cancellation"
                        className="min-h-28 resize-none"
                      />
                      {cancelError && (
                        <p className="text-sm font-medium text-red-600">
                          {cancelError}
                        </p>
                      )}
                    </div>
                    <DialogFooter>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setCancelOpen(false)}
                        disabled={cancelling}
                      >
                        Keep Appointment
                      </Button>
                      <Button
                        type="button"
                        variant="destructive"
                        disabled={!reason.trim() || cancelling}
                        onClick={cancelAppointment}
                      >
                        {cancelling ? "Cancelling..." : "Confirm Cancel"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}
          </div>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
        <section className="space-y-5">
          {appointment.work_job && (
            <LinkedWorkJobCard workJob={appointment.work_job} />
          )}

          <CustomerOrderNextStepCard appointment={appointment} />

          <AppointmentInfoCard appointment={appointment} />

          <AppointmentMeasurementRecords
            appointmentId={appointment.id}
            appointmentNumber={appointment.appointment_number}
            customerName={appointment.full_name}
            serviceType={appointment.service_type}
            address={appointment.address}
            audience="customer"
          />

          {/* <CustomerQuoteImageList quotation={appointment.quotation} /> */}
        </section>

        <aside className="space-y-4">
          <CustomerActivityLog
            remarks={appointment.remarks}
            emptyDescription="Updates from your inspection request will appear here."
          />
          <CustomerQuoteSummary
            quotation={appointment.quotation}
            signerName={appointment.full_name}
            canSign={quotationCanBeSigned}
            canDownload={quotationCanBeDownloaded}
            onSigned={reload}
            appointment={appointment}
          />
        </aside>
      </div>
    </>
  );
}

function LinkedWorkJobCard({
  workJob,
}: {
  workJob: NonNullable<CustomerAppointment["work_job"]>;
}) {
  return (
    <section className="rounded-[1.5rem] border border-[#dce4ea] bg-white p-5 shadow-[0_18px_60px_rgba(22,45,74,0.06)]">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <BriefcaseBusiness className="size-4 text-primary" />
            <h2 className="text-xs font-semibold uppercase tracking-widest text-primary">
              Work Job Created
            </h2>
          </div>
          <p className="mt-2 text-sm font-medium text-slate-950">{workJob.work_job_number}</p>
          <p className="mt-1 text-xs text-slate-500">
            {workJob.scheduled_date
              ? `${workJob.scheduled_date} · ${workJob.scheduled_time_from ?? "-"}-${workJob.scheduled_time_until ?? "-"}`
              : "Schedule pending"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <CustomerStatusBadge status={workJob.status} />
          <Button asChild type="button" variant="outline" size="sm">
            <Link href={`/account/work-jobs/${workJob.id}`}>View Work Job</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
