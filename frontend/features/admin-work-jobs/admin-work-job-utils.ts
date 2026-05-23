import type { AdminAppointment } from "@/features/admin-appointments/types";
import type { AdminBackJobReason, AdminWorkJob, AdminWorkJobForm, AdminWorkJobStatus } from "./types";

export const adminWorkJobStatusOptions = [
  { value: "all", label: "All statuses" },
  { value: "pending", label: "Pending" },
  { value: "in_progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

export const backJobReasonOptions: { value: AdminBackJobReason; label: string; description: string }[] = [
  {
    value: "unfinished_work",
    label: "Unfinished Work",
    description: "The crew needs another visit because work could not be finished on the same day.",
  },
  {
    value: "quality_issue",
    label: "Quality Issue",
    description: "Something needs correction after inspection, such as alignment, screws, sealant, or finish.",
  },
  {
    value: "missing_parts",
    label: "Missing Parts",
    description: "The team needs to return after hardware, glass, aluminum, or accessories become available.",
  },
  {
    value: "warranty_claim",
    label: "Warranty Claim",
    description: "A completed job needs service under warranty.",
  },
  {
    value: "customer_request",
    label: "Customer Request",
    description: "The customer asked for a return visit or follow-up adjustment.",
  },
  {
    value: "other",
    label: "Other",
    description: "Use this for special cases that do not fit the standard reasons.",
  },
];

export const workJobStatusStyle: Record<AdminWorkJobStatus, string> = {
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  in_progress: "bg-blue-50 text-blue-700 border-blue-200",
  completed: "bg-green-50 text-green-700 border-green-200",
  cancelled: "bg-red-50 text-red-700 border-red-200",
};

export function emptyWorkJobForm(): AdminWorkJobForm {
  return {
    appointment_id: null,
    quotation_id: null,
    first_name: "",
    last_name: "",
    phone_number: "",
    email: "",
    address: "",
    address_pinned: "",
    address_lat: "",
    address_lng: "",
    service_type: "installation",
    service_type_other: "",
    scheduled_date: "",
    scheduled_time_from: "09:00",
    scheduled_time_until: "11:00",
    worker_ids: [],
    is_down_payment_required: false,
    down_payment_percentage: 20,
    notes: "",
  };
}

export function workJobFormFromAppointment(appointment: AdminAppointment): AdminWorkJobForm {
  return {
    appointment_id: appointment.id,
    quotation_id: appointment.quotation?.id ?? null,
    first_name: appointment.first_name,
    last_name: appointment.last_name,
    phone_number: appointment.phone_number,
    email: appointment.email ?? "",
    address: appointment.address ?? "",
    address_pinned: appointment.address_pinned ?? "",
    address_lat: appointment.address_lat ?? "",
    address_lng: appointment.address_lng ?? "",
    service_type: appointment.service_type,
    service_type_other: appointment.service_type_other ?? "",
    scheduled_date: appointment.appointment_date ?? "",
    scheduled_time_from: appointment.appointment_time_from ?? "09:00",
    scheduled_time_until: appointment.appointment_time_until ?? "11:00",
    worker_ids: appointment.workers.map((worker) => worker.id),
    is_down_payment_required: false,
    down_payment_percentage: 20,
    notes: appointment.additional_notes ?? "",
  };
}

export function formatWorkJobDate(value?: string | null) {
  if (!value) return "-";

  return new Date(`${value}T00:00:00`).toLocaleDateString("en-PH", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function formatWorkJobTime(value?: string | null) {
  if (!value) return "-";

  const [hours, minutes] = value.split(":").map(Number);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return value;

  return `${hours % 12 || 12}:${String(minutes).padStart(2, "0")} ${hours >= 12 ? "PM" : "AM"}`;
}

export function formatWorkJobSchedule(workJob: AdminWorkJob) {
  return `${formatWorkJobDate(workJob.scheduled_date)} · ${formatWorkJobTime(workJob.scheduled_time_from)} - ${formatWorkJobTime(workJob.scheduled_time_until)}`;
}

export function workJobStatusLabel(status: string) {
  return status
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function backJobReasonLabel(reason?: string | null, fallback?: string | null) {
  if (fallback) return fallback;
  if (!reason) return "Back Job";

  return reason
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}
