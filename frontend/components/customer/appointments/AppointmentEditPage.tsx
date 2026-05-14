"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import AppointmentForm from "@/components/customer/appointments/AppointmentForm";
import CustomerShell from "@/components/customer/shared/CustomerShell";
import { getCustomerAppointment } from "@/features/customer/customer-api";
import type { CustomerAppointment } from "@/features/customer/types";

export default function AppointmentEditPage({ appointmentId }: { appointmentId: string }) {
  const [appointment, setAppointment] = useState<CustomerAppointment | null>(null);

  useEffect(() => {
    getCustomerAppointment(appointmentId).then((response) => setAppointment(response.data));
  }, [appointmentId]);

  if (!appointment) {
    return (
      <CustomerShell>
        <p className="text-sm text-slate-500">Loading appointment...</p>
      </CustomerShell>
    );
  }

  return (
    <CustomerShell>
      <div className="mb-6">
        <Link href={`/account/appointments/${appointment.id}`} className="text-sm font-bold text-primary hover:underline">
          Back to appointment
        </Link>
        <p className="mt-4 text-xs font-bold uppercase tracking-widest text-primary">Edit Appointment</p>
        <h1 className="mt-2 text-3xl font-black text-slate-950">
          {appointment.can_edit ? "Update your request" : "Editing locked"}
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          {appointment.can_edit
            ? "Pending appointments can be edited before SOG confirms your inspection."
            : "This appointment is no longer pending, so changes must be coordinated with the SOG team."}
        </p>
      </div>

      {appointment.can_edit ? (
        <AppointmentForm appointment={appointment} />
      ) : (
        <div className="rounded-lg border border-slate-200 bg-white p-8 text-sm font-semibold text-slate-600">
          You cannot edit this appointment because its status is {appointment.status_label}.
        </div>
      )}
    </CustomerShell>
  );
}
