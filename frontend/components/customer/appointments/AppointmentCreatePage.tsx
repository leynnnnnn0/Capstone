"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

import AppointmentForm from "@/components/customer/appointments/AppointmentForm";
import CustomerShell from "@/components/customer/shared/CustomerShell";
import { getCustomerAppointment } from "@/features/customer/customer-api";
import type { CustomerAppointment } from "@/features/customer/types";

export default function AppointmentCreatePage() {
  const searchParams = useSearchParams();
  const rebookId = searchParams.get("rebook");
  const [source, setSource] = useState<CustomerAppointment | null | undefined>(
    rebookId ? undefined : null,
  );
  const loading = Boolean(rebookId) && source === undefined;

  useEffect(() => {
    if (!rebookId) return;

    let mounted = true;
    getCustomerAppointment(rebookId)
      .then((response) => {
        if (mounted) setSource(response.data);
      })
      .catch(() => {
        if (mounted) setSource(null);
      });

    return () => {
      mounted = false;
    };
  }, [rebookId]);

  return (
    <CustomerShell>
      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-primary">
          {source ? "Rebook Appointment" : "New Appointment"}
        </p>
        <h1 className="mt-2 text-base font-medium text-slate-950">
          {source ? "Book this appointment again" : "Book an inspection"}
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          {source
            ? "We filled in your previous details and quote items. You can adjust anything before submitting."
            : "Create a request with or without quote items. Quote items can still be added through the quote flow."}
        </p>
      </div>

      {loading ? (
        <div className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-500">
          Loading appointment details...
        </div>
      ) : (
        <AppointmentForm prefillAppointment={source ?? undefined} />
      )}
    </CustomerShell>
  );
}
