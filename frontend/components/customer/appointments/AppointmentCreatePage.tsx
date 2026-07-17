"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

import AppointmentForm from "@/components/customer/appointments/AppointmentForm";
import CustomerPageHeader from "@/components/customer/shared/CustomerPageHeader";
import { FormPageSkeleton } from "@/components/ui/page-skeletons";
import {
  getCustomerAppointment,
  getCustomerAppointments,
} from "@/features/customer/customer-api";
import type { CustomerAppointment } from "@/features/customer/types";

export default function AppointmentCreatePage() {
  const searchParams = useSearchParams();
  const rebookId = searchParams.get("rebook");
  const [source, setSource] = useState<CustomerAppointment | null | undefined>(
    rebookId ? undefined : null,
  );
  const [latestPrefill, setLatestPrefill] = useState<
    CustomerAppointment | null | undefined
  >(rebookId ? null : undefined);
  const loading = rebookId ? source === undefined : latestPrefill === undefined;
  const prefillAppointment = source ?? latestPrefill ?? undefined;
  const isRebook = Boolean(source);

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

  useEffect(() => {
    if (rebookId) return;

    let mounted = true;
    getCustomerAppointments({ per_page: 1 })
      .then((response) => {
        if (mounted) setLatestPrefill(response.data[0] ?? null);
      })
      .catch(() => {
        if (mounted) setLatestPrefill(null);
      });

    return () => {
      mounted = false;
    };
  }, [rebookId]);

  return (
    <>
      <CustomerPageHeader
        eyebrow={isRebook ? "Rebook Appointment" : "New Appointment"}
        title={isRebook ? "Book this visit again." : "Book an inspection."}
        description={
          isRebook
            ? "We filled in your previous details and quote items. You can adjust anything before submitting."
            : latestPrefill
              ? "We filled in your latest appointment details. Quote items start empty for this new request."
              : "Create a request with or without quote items. Quote items can still be added through the quote flow."
        }
      />

      {loading ? (
        <FormPageSkeleton />
      ) : (
        <AppointmentForm
          prefillAppointment={prefillAppointment}
          includePrefillQuotation={isRebook}
        />
      )}
    </>
  );
}
