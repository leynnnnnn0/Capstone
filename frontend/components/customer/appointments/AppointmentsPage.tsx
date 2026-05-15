"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

import AppointmentCard from "@/components/customer/appointments/AppointmentCard";
import CustomerShell from "@/components/customer/shared/CustomerShell";
import { getCustomerAppointments } from "@/features/customer/customer-api";
import type { CustomerAppointment } from "@/features/customer/types";
import { useRealtimeRefresh } from "@/hooks/use-realtime";

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<CustomerAppointment[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(() => {
    getCustomerAppointments()
      .then((response) => setAppointments(response.data))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  useRealtimeRefresh(() => {
    setLoading(true);
    reload();
  }, ["appointment", "quotation"]);

  return (
    <CustomerShell>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">Appointments</p>
          <h1 className="mt-2 text-base font-medium text-slate-950">Your inspection requests</h1>
          <p className="mt-1 text-sm text-slate-500">
            Create, review, edit pending requests, or cancel appointments.
          </p>
        </div>
        <Link href="/account/appointments/new" className="inline-flex h-10 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-white">
          New Appointment
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {appointments.map((appointment) => (
          <AppointmentCard key={appointment.id} appointment={appointment} />
        ))}
      </div>

      {!loading && appointments.length === 0 && (
        <div className="rounded-lg border border-dashed border-slate-200 bg-white p-10 text-center">
          <p className="font-medium text-slate-900">No appointments yet</p>
          <p className="mt-1 text-sm text-slate-500">Start by creating your first inspection request.</p>
        </div>
      )}
    </CustomerShell>
  );
}
