import {
  CalendarDays,
  Clock,
  FileText,
  Mail,
  Phone,
  User,
  Wrench,
} from "lucide-react";
import type { ComponentType, ReactNode } from "react";

import { formatAdminDate } from "@/features/admin-appointments/admin-appointment-utils";
import type { AdminAppointment } from "@/features/admin-appointments/types";

export default function AdminAppointmentDetailsCard({ appointment }: { appointment: AdminAppointment }) {
  return (
    <div className="rounded-lg border bg-card p-5 shadow-sm">
      <h2 className="mb-5 text-xs font-semibold uppercase tracking-widest text-primary">Appointment Details</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <Detail icon={User} label="Customer">{appointment.full_name}</Detail>
        <Detail icon={Phone} label="Phone">{appointment.phone_number}</Detail>
        <Detail icon={Mail} label="Email">{appointment.email || "-"}</Detail>
        <Detail icon={Wrench} label="Service Type">
          <span className="capitalize">{appointment.service_type}</span>
          {appointment.service_type_other && <span className="ml-1 text-muted-foreground">({appointment.service_type_other})</span>}
        </Detail>
        <Detail icon={CalendarDays} label="Preferred Date">{formatAdminDate(appointment.preferred_date)}</Detail>
        <Detail icon={Clock} label="Preferred Time"><span className="capitalize">{appointment.preferred_time}</span></Detail>
        {appointment.additional_notes && (
          <div className="sm:col-span-2">
            <Detail icon={FileText} label="Notes">{appointment.additional_notes}</Detail>
          </div>
        )}
      </div>
    </div>
  );
}

function Detail({ icon: Icon, label, children }: { icon: ComponentType<{ className?: string }>; label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        <Icon className="size-3.5" /> {label}
      </div>
      <p className="text-sm text-foreground">{children}</p>
    </div>
  );
}
