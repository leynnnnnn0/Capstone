"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CalendarDays, Pencil, XCircle } from "lucide-react";

import AppointmentInfoCard from "@/components/customer/appointments/AppointmentInfoCard";
import CustomerLocationCard from "@/components/customer/shared/CustomerLocationCard";
import CustomerProgress from "@/components/customer/shared/CustomerProgress";
import CustomerQuoteSummary from "@/components/customer/shared/CustomerQuoteSummary";
import CustomerShell from "@/components/customer/shared/CustomerShell";
import CustomerStatusBadge from "@/components/customer/shared/CustomerStatusBadge";
import { Button } from "@/components/ui/button";
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
} from "@/features/customer/customer-api";
import type { CustomerAppointment } from "@/features/customer/types";

export default function AppointmentDetailPage({ appointmentId }: { appointmentId: string }) {
  const router = useRouter();
  const [appointment, setAppointment] = useState<CustomerAppointment | null>(null);
  const [reason, setReason] = useState("");
  const [cancelling, setCancelling] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelError, setCancelError] = useState("");

  useEffect(() => {
    getCustomerAppointment(appointmentId).then((response) => setAppointment(response.data));
  }, [appointmentId]);

  async function cancelAppointment() {
    if (!appointment || !reason.trim()) return;

    try {
      setCancelling(true);
      setCancelError("");
      const response = await cancelCustomerAppointment(appointment.id, reason);
      setAppointment(response.data);
      setReason("");
      setCancelOpen(false);
    } catch {
      setCancelError("We could not cancel this appointment. Please try again.");
    } finally {
      setCancelling(false);
    }
  }

  if (!appointment) {
    return (
      <CustomerShell>
        <p className="text-sm text-slate-500">Loading appointment...</p>
      </CustomerShell>
    );
  }



  return (
    <CustomerShell>
      <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <button
            onClick={() => router.back()}
            className="mb-3 text-sm font-bold text-primary hover:underline"
          >
            Back
          </button>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
            {appointment.appointment_number}
          </p>
          <h1 className="mt-1 text-3xl font-black text-slate-950">
            {appointment.full_name}
          </h1>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
          <CustomerStatusBadge status={appointment.status} />
          <div className="flex flex-wrap gap-2">
            {appointment.can_edit ? (
              <Button asChild type="button" variant="outline" className="h-10 gap-2">
                <Link href={`/account/appointments/${appointment.id}/edit`}>
                  <Pencil className="size-4" />
                  Edit Appointment
                </Link>
              </Button>
            ) : (
              <Button type="button" variant="outline" className="h-10 gap-2" disabled>
                <Pencil className="size-4" />
                Edit Appointment
              </Button>
            )}
            <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
              <DialogTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  className="h-10 gap-2 border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800"
                  disabled={!appointment.can_cancel}
                >
                  <XCircle className="size-4" />
                  Cancel Appointment
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Cancel appointment?</DialogTitle>
                  <DialogDescription>
                    Please tell us why you want to cancel. This keeps the team informed and helps with follow-up.
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
                    <p className="text-sm font-semibold text-red-600">{cancelError}</p>
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
          </div>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
        <section className="space-y-5">
          <AppointmentInfoCard appointment={appointment} />

          <CustomerLocationCard
            address={appointment.address}
            addressLat={appointment.address_lat}
            addressLng={appointment.address_lng}
          />
        </section>

        <aside className="space-y-4">
          <CustomerProgress
            status={appointment.status}
            type="appointment"
            reference={appointment.appointment_number}
            createdAt={appointment.created_at}
            scheduledDate={appointment.appointment_date}
            timeFrom={appointment.appointment_time_from}
            timeUntil={appointment.appointment_time_until}
            remarks={appointment.remarks}
          />

          <CustomerQuoteSummary quotation={appointment.quotation} />
        </aside>
      </div>
    </CustomerShell>
  );
}

function appointmentCalendarUrl(appointment: CustomerAppointment) {
  if (
    !appointment.appointment_date ||
    !appointment.appointment_time_from ||
    !appointment.appointment_time_until
  ) {
    return "";
  }

  const start = toGoogleCalendarDate(
    appointment.appointment_date,
    appointment.appointment_time_from,
  );
  const end = toGoogleCalendarDate(
    appointment.appointment_date,
    appointment.appointment_time_until,
  );
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: `SOG Glass Inspection - ${appointment.full_name}`,
    dates: `${start}/${end}`,
    details: appointment.additional_notes ?? "",
    location: appointment.address,
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function toGoogleCalendarDate(date: string, time: string) {
  const [hour = "00", minute = "00"] = time.split(":");
  return `${date.replaceAll("-", "")}T${hour.padStart(2, "0")}${minute.padStart(2, "0")}00`;
}
