"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

import AppointmentCard from "@/components/customer/appointments/AppointmentCard";
import CustomerPageHeader from "@/components/customer/shared/CustomerPageHeader";
import { Button } from "@/components/ui/button";
import { CustomerCardGridSkeleton } from "@/components/ui/page-skeletons";
import { getCustomerAppointments } from "@/features/customer/customer-api";
import type { CustomerAppointment } from "@/features/customer/types";
import type { PaginatedResponse } from "@/features/products/types";
import { useRealtimeRefresh } from "@/hooks/use-realtime";

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<CustomerAppointment[]>([]);
  const [meta, setMeta] = useState<PaginatedResponse<CustomerAppointment>["meta"]>(undefined);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(() => {
    setLoading(true);
    getCustomerAppointments({ page, per_page: 9 })
      .then((response) => {
        setAppointments(response.data);
        setMeta(response.meta);
      })
      .finally(() => setLoading(false));
  }, [page]);

  useEffect(() => {
    void Promise.resolve().then(reload);
  }, [reload]);

  useRealtimeRefresh(() => {
    reload();
  }, ["appointment", "quotation"]);

  return (
    <>
      <CustomerPageHeader
        eyebrow="Appointments"
        title="Your inspection requests."
        description="Create a new request, review confirmed schedules, or manage appointments that still need changes."
        action={
          <Link href="/account/appointments/new" className="inline-flex items-center justify-center rounded-full bg-white px-5 py-3 text-sm font-semibold text-[#162d4a] transition-colors hover:bg-[#c8dae8]">
            New appointment
          </Link>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {loading ? (
          <CustomerCardGridSkeleton />
        ) : (
          appointments.map((appointment) => (
            <AppointmentCard key={appointment.id} appointment={appointment} />
          ))
        )}
      </div>

      {!loading && appointments.length === 0 && (
        <div className="rounded-[1.5rem] border border-dashed border-[#cbd6de] bg-white p-12 text-center">
          <p className="text-lg font-medium text-[#101820]">No appointments yet</p>
          <p className="mt-2 text-sm text-[#667584]">Start by creating your first inspection request.</p>
        </div>
      )}

      {meta && meta.last_page > 1 && (
        <div className="mt-6 flex flex-wrap items-center justify-end gap-3 rounded-full bg-white p-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={meta.current_page <= 1 || loading}
            onClick={() => setPage((value) => Math.max(1, value - 1))}
          >
            Previous
          </Button>
          <span className="text-sm text-slate-500">
            Page {meta.current_page} of {meta.last_page}
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={meta.current_page >= meta.last_page || loading}
            onClick={() => setPage((value) => value + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </>
  );
}
