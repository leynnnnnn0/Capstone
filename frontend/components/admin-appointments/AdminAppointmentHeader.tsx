"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CalendarDays, Ellipsis, FilePenLine, FileText, PlusCircle, XCircle } from "lucide-react";

import AdminAppointmentCancellation, { canCancelAppointment } from "@/components/admin-appointments/AdminAppointmentCancellation";
import AdminAppointmentCalendar from "@/components/admin-appointments/AdminAppointmentCalendar";
import AdminAppointmentStatusBadge from "@/components/admin-appointments/AdminAppointmentStatusBadge";
import { AdminPageHeader } from "@/components/ui/admin-page-header";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { fetchAdminAppointments } from "@/features/admin-appointments/admin-appointment-api";
import { hasRole } from "@/features/auth/current-user-api";
import { CustomerStatus } from "@/features/customer/status";
import type { AdminAppointment } from "@/features/admin-appointments/types";
import { useRealtimeRefresh } from "@/hooks/use-realtime";
import { useCurrentUser } from "@/hooks/use-current-user";
import { safeReturnTo, withReturnTo } from "@/lib/return-to";

export default function AdminAppointmentHeader({
  appointment,
  onOpenQuotation,
  quotationOpen,
  onUpdated,
}: {
  appointment: AdminAppointment;
  onOpenQuotation: () => void;
  quotationOpen: boolean;
  onUpdated: (appointment: AdminAppointment) => void;
}) {
  const { user } = useCurrentUser();
  const searchParams = useSearchParams();
  const [appointments, setAppointments] = useState<AdminAppointment[]>([]);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [cancellationOpen, setCancellationOpen] = useState(false);
  const menuTrigger = useRef<HTMLButtonElement>(null);
  const canCancel = canCancelAppointment(appointment.status);
  const isLocked = [CustomerStatus.Cancelled, CustomerStatus.NoShow].includes(appointment.status);
  const isWorker = hasRole(user, "staff");
  const backHref = safeReturnTo(searchParams.get("returnTo"), "/dashboard/appointments");

  const refreshCalendar = useCallback(() => {
    if (!calendarOpen) return;

    fetchAdminAppointments({ per_page: "100" })
      .then((response) => setAppointments(response.data))
      .catch(() => { /* Keep the last successful snapshot. */ });
  }, [calendarOpen]);

  useEffect(refreshCalendar, [refreshCalendar]);
  useRealtimeRefresh(refreshCalendar, ["appointment", "work_job"]);

  function restoreMenuFocus(event: Event) {
    event.preventDefault();
    menuTrigger.current?.focus();
  }

  return (
    <AdminPageHeader
      backHref={backHref}
      backLabel="Back to appointments"
      eyebrow="Customer scheduling"
      title={appointment.full_name}
      description="Review the customer details, service schedule, assigned staff, and quotation."
      icon={CalendarDays}
      recordLabel="Appointment record"
      recordValue={appointment.appointment_number}
      actions={(
        <>
          <AdminAppointmentStatusBadge status={appointment.status} />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button ref={menuTrigger} type="button" variant="outline" size="icon-sm" aria-label="More appointment actions">
                <Ellipsis aria-hidden="true" className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-auto min-w-48"
              onCloseAutoFocus={(event) => {
                if (calendarOpen || quotationOpen || cancellationOpen) event.preventDefault();
              }}
            >
              {!isLocked && !isWorker && (
                <DropdownMenuItem asChild>
                  <Link href={withReturnTo(`/dashboard/appointments/${appointment.id}/edit`, backHref)}>
                    <FilePenLine aria-hidden="true" />
                    Edit Appointment
                  </Link>
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onSelect={() => setCalendarOpen(true)}>
                <CalendarDays aria-hidden="true" />
                Open Calendar
              </DropdownMenuItem>
              {!isLocked && (
                <DropdownMenuItem onSelect={onOpenQuotation}>
                  {appointment.quotation ? <FileText aria-hidden="true" /> : <PlusCircle aria-hidden="true" />}
                  {appointment.quotation ? "Edit Quotation" : "Create Quotation"}
                </DropdownMenuItem>
              )}
              {canCancel && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem variant="destructive" onSelect={() => setCancellationOpen(true)}>
                    <XCircle aria-hidden="true" />
                    Cancel Appointment
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
          <Sheet open={calendarOpen} onOpenChange={setCalendarOpen}>
            <SheetContent
              side="left"
              className="overflow-y-auto p-0 sm:max-w-none"
              style={{ width: "min(1180px, calc(100vw - 32px))", maxWidth: "none" }}
              onCloseAutoFocus={restoreMenuFocus}
            >
              <SheetHeader className="border-b px-6 py-5 text-left">
                <SheetTitle>Calendar</SheetTitle>
                <SheetDescription>Appointments overview and staff schedule.</SheetDescription>
              </SheetHeader>
              <div className="px-6 py-6">
                <AdminAppointmentCalendar appointments={appointments} />
              </div>
            </SheetContent>
          </Sheet>
          <AdminAppointmentCancellation
            appointment={appointment}
            onUpdated={onUpdated}
            open={canCancel && cancellationOpen}
            onOpenChange={setCancellationOpen}
            onCloseAutoFocus={restoreMenuFocus}
          />
        </>
      )}
    />
  );
}
