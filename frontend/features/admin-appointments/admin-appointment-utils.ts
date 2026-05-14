import { minimumBookingDate } from "@/features/booking/booking-utils";
import type { AdminAppointment, AdminAppointmentForm, AdminAppointmentStatus } from "./types";

export const adminStatusMeta: Record<AdminAppointmentStatus, { label: string; className: string }> = {
  pending: { label: "Pending", className: "bg-amber-50 text-amber-700 border-amber-200" },
  confirmed: { label: "Confirmed", className: "bg-blue-50 text-blue-700 border-blue-200" },
  rescheduled: { label: "Rescheduled", className: "bg-sky-50 text-sky-700 border-sky-200" },
  on_the_way: { label: "On the Way", className: "bg-indigo-50 text-indigo-700 border-indigo-200" },
  in_progress: { label: "In Progress", className: "bg-violet-50 text-violet-700 border-violet-200" },
  completed: { label: "Completed", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  cancelled: { label: "Cancelled", className: "bg-red-50 text-red-700 border-red-200" },
  reopened: { label: "Reopened", className: "bg-sky-50 text-sky-700 border-sky-200" },
  no_show: { label: "No Show", className: "bg-red-50 text-red-700 border-red-200" },
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
  ...Object.entries(adminStatusMeta).map(([value, meta]) => ({ value, label: meta.label })),
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
    status: "pending",
    appointment_date: minimumBookingDate(),
    appointment_time_from: "09:00",
    appointment_time_until: "11:00",
    worker_ids: [],
    quotation_notes: "",
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
