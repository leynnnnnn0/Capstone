"use client";

import Link from "next/link";
import { CalendarDays, MapPin } from "lucide-react";

import CustomerStatusBadge from "@/components/customer/shared/CustomerStatusBadge";
import {
  formatCustomerDate,
  quotationTotal,
  formatPeso,
} from "@/features/customer/customer-utils";
import type { CustomerAppointment } from "@/features/customer/types";

export default function AppointmentCard({ appointment }: { appointment: CustomerAppointment }) {
  return (
    <Link
      href={`/account/appointments/${appointment.id}`}
      className="block rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md"
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
            {appointment.appointment_number}
          </p>
          <h3 className="mt-1 text-base font-medium text-slate-950">
            {appointment.service_type === "other" ? appointment.service_type_other : appointment.service_type}
          </h3>
        </div>
        <CustomerStatusBadge status={appointment.status} />
      </div>

      <div className="space-y-2 text-sm text-slate-600">
        <p className="flex items-center gap-2">
          <CalendarDays className="size-4 text-primary" />
          {formatCustomerDate(appointment.preferred_date)} · {appointment.preferred_time}
        </p>
        <p className="flex items-start gap-2">
          <MapPin className="mt-0.5 size-4 shrink-0 text-primary" />
          <span className="line-clamp-2">{appointment.address}</span>
        </p>
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
        <span className="text-xs font-medium text-slate-400">
          {appointment.quotation ? `${appointment.quotation.items.length} quote item(s)` : "No quote yet"}
        </span>
        <span className="text-sm font-semibold text-primary">
          {appointment.quotation ? formatPeso(quotationTotal(appointment.quotation)) : "View"}
        </span>
      </div>
    </Link>
  );
}
