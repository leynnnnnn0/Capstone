"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CalendarDays, FilePenLine, FileText, PlusCircle } from "lucide-react";

import AdminAppointmentCalendar from "@/components/admin-appointments/AdminAppointmentCalendar";
import AdminAppointmentStatusBadge from "@/components/admin-appointments/AdminAppointmentStatusBadge";
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
import type { AdminAppointment } from "@/features/admin-appointments/types";

export default function AdminAppointmentHeader({
  appointment,
  onOpenQuotation,
}: {
  appointment: AdminAppointment;
  onOpenQuotation: () => void;
}) {
  const [appointments, setAppointments] = useState<AdminAppointment[]>([]);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const isLocked = ["cancelled", "no_show"].includes(appointment.status);

  useEffect(() => {
    if (!calendarOpen) return;

    fetchAdminAppointments({ per_page: "100" }).then((response) => setAppointments(response.data));
  }, [calendarOpen]);

  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
      <div>
        <Link href="/dashboard/appointments" className="text-sm font-bold text-primary hover:underline">
          Back to appointments
        </Link>
        <p className="mt-4 text-xs font-semibold uppercase tracking-widest text-primary">{appointment.appointment_number}</p>
        <h1 className="mt-1 text-2xl font-bold text-foreground">{appointment.full_name}</h1>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <AdminAppointmentStatusBadge status={appointment.status} />
        {!isLocked && (
          <Button asChild variant="outline" size="sm" className="gap-1.5">
            <Link href={`/dashboard/appointments/${appointment.id}/edit`}>
              <FilePenLine className="size-3.5" />
              Edit Appointment
            </Link>
          </Button>
        )}
        <Sheet open={calendarOpen} onOpenChange={setCalendarOpen}>
          <SheetTrigger asChild>
            <Button type="button" variant="outline" size="sm" className="gap-1.5">
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
          <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={onOpenQuotation}>
            {appointment.quotation ? <FileText className="size-3.5" /> : <PlusCircle className="size-3.5" />}
            {appointment.quotation ? "Edit Quotation" : "Create Quotation"}
          </Button>
        )}
      </div>
    </div>
  );
}
