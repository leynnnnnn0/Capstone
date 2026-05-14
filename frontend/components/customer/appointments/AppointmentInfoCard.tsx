import {
  CalendarDays,
  Clock,
  FileText,
  Mail,
  Phone,
  User,
  UserRoundCheck,
  Wrench,
} from "lucide-react";
import type { ComponentType } from "react";

import {
  formatCustomerDate,
  formatCustomerSchedule,
} from "@/features/customer/customer-utils";
import type { CustomerAppointment } from "@/features/customer/types";

export default function AppointmentInfoCard({ appointment }: { appointment: CustomerAppointment }) {
  const serviceType =
    appointment.service_type === "other"
      ? appointment.service_type_other ?? "Other"
      : appointment.service_type;
  const inspectors = appointment.workers.length
    ? appointment.workers.map((worker) => worker.full_name).join(", ")
    : "Pending assignment";

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="mb-5 text-sm font-black uppercase tracking-widest text-primary">
        Appointment Details
      </h2>
      <div className="grid gap-x-10 gap-y-7 md:grid-cols-2">
        <Info icon={User} label="Customer" value={appointment.full_name} />
        <Info icon={Phone} label="Phone" value={appointment.phone_number} />
        <Info icon={Mail} label="Email" value={appointment.email ?? "-"} />
        <Info icon={Wrench} label="Service Type" value={serviceType} />
        <Info
          icon={CalendarDays}
          label="Preferred Date"
          value={formatCustomerDate(appointment.preferred_date)}
        />
        <Info
          icon={Clock}
          label="Preferred Time"
          value={appointment.preferred_time === "morning" ? "Morning (8 AM-12 PM)" : "Afternoon (1-5 PM)"}
        />
        {appointment.status !== "pending" && (
          <>
            <Info
              icon={CalendarDays}
              label="Confirmed Date"
              value={formatCustomerSchedule(
                appointment.appointment_date,
                appointment.appointment_time_from,
                appointment.appointment_time_until,
              )}
            />
            <Info icon={UserRoundCheck} label="Inspectors" value={inspectors} />
          </>
        )}
        {appointment.additional_notes && (
          <Info icon={FileText} label="Notes" value={appointment.additional_notes} wide />
        )}
      </div>
    </div>
  );
}

type IconComponent = ComponentType<{ className?: string }>;

function Info({
  icon: Icon,
  label,
  value,
  wide,
}: {
  icon: IconComponent;
  label: string;
  value: string;
  wide?: boolean;
}) {
  return (
    <div className={wide ? "md:col-span-2" : ""}>
      <div className="mb-2 flex items-center gap-2 text-sm font-black uppercase tracking-wide text-slate-500">
        <Icon className="size-4 text-slate-500" />
        {label}
      </div>
      <p className="text-base font-medium leading-relaxed text-slate-950">{value}</p>
    </div>
  );
}
