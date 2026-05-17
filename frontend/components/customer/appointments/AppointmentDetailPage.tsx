"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BriefcaseBusiness, RotateCcw, Pencil, XCircle } from "lucide-react";

import AppointmentInfoCard from "@/components/customer/appointments/AppointmentInfoCard";
import CustomerActivityLog from "@/components/customer/shared/CustomerActivityLog";
import CustomerLocationCard from "@/components/customer/shared/CustomerLocationCard";
import CustomerQuoteImageList from "@/components/customer/shared/CustomerQuoteImageList";
import CustomerQuoteSummary from "@/components/customer/shared/CustomerQuoteSummary";
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
      <>
        <p className="text-sm text-slate-500">Loading appointment...</p>
      </>
    );
  }

  const quotationCanBeSigned =
    !["cancelled", "no_show", "completed"].includes(appointment.status) &&
    !["cancelled", "no_show", "completed"].includes(appointment.work_job?.status ?? "");
  const quotationCanBeDownloaded =
    !["cancelled", "no_show"].includes(appointment.status) &&
    !["cancelled", "no_show"].includes(appointment.work_job?.status ?? "");

  return (
    <>
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
            {(appointment.status === "pending" ||
              appointment.status === "confirmed") &&
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

          
          <AppointmentInfoCard appointment={appointment} />

          <CustomerLocationCard
            address={appointment.address}
            addressLat={appointment.address_lat}
            addressLng={appointment.address_lng}
            compact
          />

          <CustomerQuoteImageList quotation={appointment.quotation} />
        </section>

        <aside className="space-y-4">
          <CustomerQuoteSummary
            quotation={appointment.quotation}
            signerName={appointment.full_name}
            canSign={quotationCanBeSigned}
            canDownload={quotationCanBeDownloaded}
            onSigned={reload}
          />

          <CustomerActivityLog
            remarks={appointment.remarks}
            emptyDescription="Updates from your inspection request will appear here."
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
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
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
