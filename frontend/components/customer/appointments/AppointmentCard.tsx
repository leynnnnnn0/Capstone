"use client";

import Link from "next/link";
import { ArrowUpRight, BriefcaseBusiness, CalendarDays, MapPin } from "lucide-react";

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
      className="group block rounded-[1.25rem] border border-[#dce4ea] bg-white p-5 transition-all hover:-translate-y-0.5 hover:border-[#b9cbd9] hover:shadow-[0_18px_50px_rgba(22,45,74,0.09)]"
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#8ca0b2]">
            {appointment.appointment_number}
          </p>
          <h3 className="mt-2 text-lg font-medium capitalize tracking-[-0.025em] text-[#101820]">
            {appointment.service_type === "other" ? appointment.service_type_other : appointment.service_type}
          </h3>
        </div>
        <CustomerStatusBadge status={appointment.status} />
      </div>

      <div className="space-y-2.5 text-sm text-[#667584]">
        <p className="flex items-center gap-2">
          <CalendarDays className="size-4 text-[#608db9]" />
          {formatCustomerDate(appointment.preferred_date)} · {appointment.preferred_time}
        </p>
        <p className="flex items-start gap-2">
          <MapPin className="mt-0.5 size-4 shrink-0 text-[#608db9]" />
          <span className="line-clamp-2">{appointment.address}</span>
        </p>
        {appointment.work_job && (
          <p className="flex items-center gap-2 rounded-xl bg-[#eaf2f8] px-3 py-2 text-xs text-[#2c5282]">
            <BriefcaseBusiness className="size-3.5" />
            <span className="font-medium">{appointment.work_job.work_job_number}</span>
            <span className="text-primary/70">· {appointment.work_job.status_label}</span>
          </p>
        )}
      </div>

      <div className="mt-5 flex items-center justify-between border-t border-[#e8edf1] pt-4">
        <span className="text-xs font-medium text-[#8ca0b2]">
          {appointment.quotation ? `${appointment.quotation.items.length} quote item(s)` : "No quote yet"}
        </span>
        <span className="inline-flex items-center gap-1 text-sm font-semibold text-[#2c5282]">
          {appointment.quotation ? formatPeso(quotationTotal(appointment.quotation)) : "View"}
          <ArrowUpRight className="size-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
        </span>
      </div>
    </Link>
  );
}
