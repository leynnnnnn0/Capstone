import { minimumBookingDate } from "@/features/booking/booking-utils";
import { CustomerStatus, customerStatusOptions } from "@/features/customer/status";
import type { AdminAppointment, AdminAppointmentForm, AdminAppointmentStatus } from "./types";

export const adminStatusMeta: Record<AdminAppointmentStatus, { label: string; className: string }> = {
  [CustomerStatus.Pending]: { label: "Pending", className: "border-transparent bg-amber-500 text-white" },
  [CustomerStatus.Confirmed]: { label: "Confirmed", className: "border-transparent bg-blue-600 text-white" },
  [CustomerStatus.Rescheduled]: { label: "Rescheduled", className: "border-transparent bg-sky-600 text-white" },
  [CustomerStatus.OnTheWay]: { label: "On the Way", className: "border-transparent bg-indigo-600 text-white" },
  [CustomerStatus.InProgress]: { label: "In Progress", className: "border-transparent bg-violet-600 text-white" },
  [CustomerStatus.Completed]: { label: "Completed", className: "border-transparent bg-emerald-600 text-white" },
  [CustomerStatus.Cancelled]: { label: "Cancelled", className: "border-transparent bg-red-600 text-white" },
  [CustomerStatus.Reopened]: { label: "Reopened", className: "border-transparent bg-cyan-600 text-white" },
  [CustomerStatus.NoShow]: { label: "No Show", className: "border-transparent bg-rose-600 text-white" },
};

export const adminServiceOptions = [
  { value: "all", label: "All Services" },
  { value: "quotation", label: "Quotation" },
  { value: "installation", label: "Installation" },
  { value: "repair", label: "Repair" },
  { value: "maintenance", label: "Maintenance" },
  { value: "inspection", label: "Inspection" },
  { value: "other", label: "Other" },
];

export const adminStatusOptions = [
  { value: "all", label: "All Statuses" },
  ...customerStatusOptions,
];

export function createAdminAppointmentForm(): AdminAppointmentForm {
  return {
    first_name: "",
    last_name: "",
    phone_number: "",
    email: "",
    address: "",
    address_pinned: "",
    address_lat: "",
    address_lng: "",
    preferred_date: minimumBookingDate(),
    preferred_time: "afternoon",
    service_type: "inspection",
    service_type_other: "",
    additional_notes: "",
    consent: true,
    status: CustomerStatus.Pending,
    appointment_date: minimumBookingDate(),
    appointment_time_from: "09:00",
    appointment_time_until: "11:00",
    worker_ids: [],
    quotation_notes: "",
    quotation_expires_at: "",
  };
}

export function formatAdminDate(value?: string | null) {
  if (!value) return "-";

  return new Date(`${value}T00:00:00`).toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatAdminTime(value?: string | null) {
  if (!value) return "";
  const [hour = "0", minute = "00"] = value.split(":");
  const date = new Date();
  date.setHours(Number(hour), Number(minute), 0, 0);

  return date.toLocaleTimeString("en-PH", { hour: "numeric", minute: "2-digit" });
}

export function appointmentSchedule(appointment: AdminAppointment) {
  if (!appointment.appointment_date) return "Unscheduled";
  const from = formatAdminTime(appointment.appointment_time_from);
  const until = formatAdminTime(appointment.appointment_time_until);

  return `${formatAdminDate(appointment.appointment_date)}${from && until ? ` · ${from} - ${until}` : ""}`;
}

export function appointmentCalendarUrl(appointment: AdminAppointment) {
  if (!appointment.appointment_date || !appointment.appointment_time_from || !appointment.appointment_time_until) return "";

  const start = toCalendarDate(appointment.appointment_date, appointment.appointment_time_from);
  const end = toCalendarDate(appointment.appointment_date, appointment.appointment_time_until);
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: `SOG Appointment - ${appointment.full_name}`,
    dates: `${start}/${end}`,
    details: appointment.additional_notes ?? "",
    location: appointment.address,
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function toCalendarDate(date: string, time: string) {
  const [hour = "00", minute = "00"] = time.split(":");
  return `${date.replaceAll("-", "")}T${hour.padStart(2, "0")}${minute.padStart(2, "0")}00`;
}
