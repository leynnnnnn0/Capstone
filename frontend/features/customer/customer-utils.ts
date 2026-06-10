import {
  minimumBookingDate,
  resolvePreferredTimeForDate,
} from "@/features/booking/booking-utils";
import {
  activeWorkJobBlockedStatuses,
  CustomerStatus,
  customerTerminalStatuses,
} from "@/features/customer/status";

import type {
  CustomerAppointment,
  CustomerAppointmentForm,
  CustomerQuotation,
  CustomerQuotationItem,
  CustomerRemark,
  CustomerWorkJob,
} from "./types";

export const customerStatusMeta: Record<CustomerStatus, { label: string; className: string }> = {
  [CustomerStatus.Pending]: { label: "Pending", className: "bg-amber-50 text-amber-700 border-amber-200" },
  [CustomerStatus.Confirmed]: { label: "Confirmed", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  [CustomerStatus.Rescheduled]: { label: "Rescheduled", className: "bg-blue-50 text-blue-700 border-blue-200" },
  [CustomerStatus.OnTheWay]: { label: "On the Way", className: "bg-blue-50 text-blue-700 border-blue-200" },
  [CustomerStatus.InProgress]: { label: "In Progress", className: "bg-blue-50 text-blue-700 border-blue-200" },
  [CustomerStatus.Completed]: { label: "Completed", className: "bg-green-100 text-green-700 border-green-200" },
  [CustomerStatus.Cancelled]: { label: "Cancelled", className: "bg-red-50 text-red-700 border-red-200" },
  [CustomerStatus.Reopened]: { label: "Reopened", className: "bg-sky-50 text-sky-700 border-sky-200" },
  [CustomerStatus.NoShow]: { label: "No Show", className: "bg-red-50 text-red-700 border-red-200" },
};

export const serviceOptions = [
  { value: "quotation", label: "Quotation" },
  { value: "installation", label: "Installation" },
  { value: "repair", label: "Repair" },
  { value: "maintenance", label: "Maintenance" },
  { value: "inspection", label: "Inspection" },
  { value: "other", label: "Other" },
] as const;

export function createCustomerAppointmentForm(): CustomerAppointmentForm {
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
  };
}

export function appointmentToForm(appointment: CustomerAppointment): CustomerAppointmentForm {
  return {
    first_name: appointment.first_name,
    last_name: appointment.last_name,
    phone_number: appointment.phone_number,
    email: appointment.email ?? "",
    address: appointment.address,
    address_pinned: appointment.address_pinned ?? "",
    address_lat: appointment.address_lat ?? "",
    address_lng: appointment.address_lng ?? "",
    preferred_date: appointment.preferred_date,
    preferred_time: appointment.preferred_time,
    service_type: appointment.service_type,
    service_type_other: appointment.service_type_other ?? "",
    additional_notes: appointment.additional_notes ?? "",
    consent: true,
  };
}

export function appointmentToCreatePrefillForm(
  appointment: CustomerAppointment,
): CustomerAppointmentForm {
  const minimumDate = minimumBookingDate();
  const preferredDate =
    appointment.preferred_date >= minimumDate ? appointment.preferred_date : minimumDate;
  const preferredTime = resolvePreferredTimeForDate(
    preferredDate,
    appointment.preferred_time,
  );

  return {
    ...appointmentToForm(appointment),
    preferred_date: preferredDate,
    preferred_time: preferredTime,
  };
}

export function formatCustomerDate(value?: string | null) {
  if (!value) return "-";

  return new Date(`${value}T00:00:00`).toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatCustomerDateTime(value?: string | null) {
  if (!value) return "Pending";

  return new Date(value).toLocaleString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatCustomerTime(value?: string | null) {
  if (!value) return "";

  const [hour = "0", minute = "00"] = value.split(":");
  const date = new Date();
  date.setHours(Number(hour), Number(minute), 0, 0);

  return date.toLocaleTimeString("en-PH", {
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatCustomerSchedule(date?: string | null, from?: string | null, until?: string | null) {
  if (!date) return "-";
  if (from && until) return `${formatCustomerDate(date)} · ${formatCustomerTime(from)} - ${formatCustomerTime(until)}`;
  return formatCustomerDate(date);
}

export function formatPeso(value: number) {
  return `₱${Number(value).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function quotationTotal(quotation?: CustomerQuotation | null) {
  return quotation?.total ?? 0;
}

export function isActiveAppointment(appointment: CustomerAppointment) {
  return !customerTerminalStatuses.includes(appointment.status);
}

export function isActiveWorkJob(workJob: CustomerWorkJob) {
  return !activeWorkJobBlockedStatuses.includes(workJob.status);
}

export function customerRemarkForAction(remarks: CustomerRemark[] | undefined, action: string) {
  return remarks?.find((remark) => remark.action === action) ?? null;
}

export function quotationItemImage(item: CustomerQuotationItem) {
  return item.before_images?.[0]?.image_url ?? item.after_images?.[0]?.image_url ?? "";
}

export function quotationItemSubtitle(item: CustomerQuotationItem) {
  const options = (item.options ?? []).map((option) => option.option_name).filter(Boolean);
  const size = item.width && item.height ? `${item.width} x ${item.height}` : null;

  return [size, ...options].filter(Boolean).slice(0, 2);
}
