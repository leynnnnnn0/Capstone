"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CalendarDays, FilePenLine, FileText, PlusCircle } from "lucide-react";

import AdminAppointmentCalendar from "@/components/admin-appointments/AdminAppointmentCalendar";
import AdminAppointmentStatusBadge from "@/components/admin-appointments/AdminAppointmentStatusBadge";
import { AdminPageHeader } from "@/components/ui/admin-page-header";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { fetchAdminAppointments } from "@/features/admin-appointments/admin-appointment-api";
import { hasRole } from "@/features/auth/current-user-api";
import { CustomerStatus } from "@/features/customer/status";
import type { AdminAppointment } from "@/features/admin-appointments/types";
import { useCurrentUser } from "@/hooks/use-current-user";
import { safeReturnTo, withReturnTo } from "@/lib/return-to";

export default function AdminAppointmentHeader({
  appointment,
  onOpenQuotation,
}: {
  appointment: AdminAppointment;
  onOpenQuotation: () => void;
}) {
  const { user } = useCurrentUser();
  const searchParams = useSearchParams();
  const [appointments, setAppointments] = useState<AdminAppointment[]>([]);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const isLocked = [CustomerStatus.Cancelled, CustomerStatus.NoShow].includes(appointment.status);
  const isWorker = hasRole(user, "worker");
  const backHref = safeReturnTo(searchParams.get("returnTo"), "/dashboard/appointments");

  useEffect(() => {
    if (!calendarOpen) return;

    fetchAdminAppointments({ per_page: "100" }).then((response) => setAppointments(response.data));
  }, [calendarOpen]);

  return (
    <AdminPageHeader
      backHref={backHref}
      backLabel="Back to appointments"
      eyebrow="Customer scheduling"
      title={appointment.full_name}
      description="Review the customer details, service schedule, assigned workers, and quotation."
      icon={CalendarDays}
      recordLabel="Appointment record"
      recordValue={appointment.appointment_number}
      actions={(
        <>
          <AdminAppointmentStatusBadge status={appointment.status} />
          {!isLocked && !isWorker && (
            <Button asChild variant="outline" size="sm" className="gap-1.5 border-white/15 bg-white/[0.06] text-white hover:bg-white/10 hover:text-white">
              <Link href={withReturnTo(`/dashboard/appointments/${appointment.id}/edit`, backHref)}>
                <FilePenLine className="size-3.5" />
                Edit Appointment
              </Link>
            </Button>
          )}
          <Sheet open={calendarOpen} onOpenChange={setCalendarOpen}>
            <SheetTrigger asChild>
              <Button type="button" variant="outline" size="sm" className="gap-1.5 border-white/15 bg-white/[0.06] text-white hover:bg-white/10 hover:text-white">
                <CalendarDays className="size-3.5" />
                Open Calendar
              </Button>
            </SheetTrigger>
            <SheetContent
              side="left"
              className="overflow-y-auto p-0 sm:max-w-none"
              style={{ width: "min(1180px, calc(100vw - 32px))", maxWidth: "none" }}
            >
              <SheetHeader className="border-b px-6 py-5 text-left">
                <SheetTitle>Calendar</SheetTitle>
                <SheetDescription>Appointments overview and workers schedule.</SheetDescription>
              </SheetHeader>
              <div className="px-6 py-6">
                <AdminAppointmentCalendar appointments={appointments} />
              </div>
            </SheetContent>
          </Sheet>
          {!isLocked && (
            <Button type="button" variant="outline" size="sm" className="gap-1.5 border-white/15 bg-white/[0.06] text-white hover:bg-white/10 hover:text-white" onClick={onOpenQuotation}>
              {appointment.quotation ? <FileText className="size-3.5" /> : <PlusCircle className="size-3.5" />}
              {appointment.quotation ? "Edit Quotation" : "Create Quotation"}
            </Button>
          )}
        </>
      )}
    />
  );
}
