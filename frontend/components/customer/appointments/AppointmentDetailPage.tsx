"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { RotateCcw, Pencil, XCircle } from "lucide-react";

import AppointmentInfoCard from "@/components/customer/appointments/AppointmentInfoCard";
import CustomerActivityLog from "@/components/customer/shared/CustomerActivityLog";
import CustomerLocationCard from "@/components/customer/shared/CustomerLocationCard";
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
import { useRealtimeRefresh } from "@/hooks/use-realtime";

export default function AppointmentDetailPage({ appointmentId }: { appointmentId: string }) {
  const router = useRouter();
  const [appointment, setAppointment] = useState<CustomerAppointment | null>(null);
  const [reason, setReason] = useState("");
  const [cancelling, setCancelling] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelError, setCancelError] = useState("");

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
        status: "cancelled",
        status_label: "Cancelled",
        can_edit: false,
        can_cancel: false,
      });
      setReason("");
      setCancelOpen(false);
    } catch {
      try {
        const latest = await getCustomerAppointment(appointment.id);

        if (latest.data.status === "cancelled") {
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
            className="mb-3 text-sm font-medium text-primary hover:underline"
          >
            Back
          </button>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-primary">
            {appointment.appointment_number}
          </p>
          <h1 className="mt-1 text-sm font-medium text-slate-950">
            {appointment.full_name}
          </h1>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
          <CustomerStatusBadge status={appointment.status} />
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
            {appointment.status == "pending" ||
              (appointment.status == "confirmed" && appointment.can_cancel && (
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
              ))}
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
            compact
          />
        </section>

        <aside className="space-y-4">
          <CustomerQuoteSummary
            quotation={appointment.quotation}
            signerName={appointment.full_name}
            onSigned={reload}
          />
          
          <CustomerActivityLog
            remarks={appointment.remarks}
            emptyDescription="Updates from your inspection request will appear here."
          />
        </aside>
      </div>
    </CustomerShell>
  );
}
