"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import AppointmentForm from "@/components/customer/appointments/AppointmentForm";
import CustomerPageHeader from "@/components/customer/shared/CustomerPageHeader";
import { FormPageSkeleton } from "@/components/ui/page-skeletons";
import { getCustomerAppointment } from "@/features/customer/customer-api";
import type { CustomerAppointment } from "@/features/customer/types";

export default function AppointmentEditPage({ appointmentId }: { appointmentId: string }) {
  const [appointment, setAppointment] = useState<CustomerAppointment | null>(null);

  useEffect(() => {
    getCustomerAppointment(appointmentId).then((response) => setAppointment(response.data));
  }, [appointmentId]);

  if (!appointment) {
    return <FormPageSkeleton />;
  }

  return (
    <>
      <CustomerPageHeader
        eyebrow="Edit Appointment"
        title={appointment.can_edit ? "Update your request." : "Editing is locked."}
        description={
          appointment.can_edit
            ? "Pending appointments can be edited before SOG confirms your inspection."
            : "This appointment is no longer pending, so changes must be coordinated with the SOG team."
        }
        action={
          <Link href={`/account/appointments/${appointment.id}`} className="inline-flex rounded-full border border-white/25 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10">
            Back to appointment
          </Link>
        }
      />

      {appointment.can_edit ? (
        <AppointmentForm appointment={appointment} />
      ) : (
        <div className="rounded-[1.5rem] border border-[#dce4ea] bg-white p-8 text-sm font-medium text-[#667584]">
          You cannot edit this appointment because its status is {appointment.status_label}.
        </div>
      )}
    </>
  );
}
