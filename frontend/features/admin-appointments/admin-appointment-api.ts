import { api } from "@/lib/api";
import type {
  AdminAppointment,
  AdminAppointmentFilters,
  AdminAppointmentForm,
  AdminWorker,
  AppointmentCollection,
  SchedulePayload,
} from "./types";
import type { QuoteItemPayload } from "@/features/quotes/types";

type ResourceResponse<T> = { data: T };
type CollectionResponse<T> = { data: T[] };

function queryString(filters: AdminAppointmentFilters = {}) {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value && value !== "all") params.set(key, value);
  });

  return params.toString();
}

export function fetchAdminAppointments(filters: AdminAppointmentFilters = {}) {
  const query = queryString(filters);
  return api<AppointmentCollection>(`/api/v1/appointments${query ? `?${query}` : ""}`);
}

export function fetchAdminAppointment(id: string | number) {
  return api<ResourceResponse<AdminAppointment>>(`/api/v1/appointments/${id}`);
}

export function createAdminAppointment(payload: AdminAppointmentForm) {
  return api<ResourceResponse<AdminAppointment>>("/api/v1/appointments", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function fetchWorkers() {
  return api<CollectionResponse<AdminWorker>>("/api/v1/workers");
}

export function fetchAvailableWorkers(payload: SchedulePayload & { appointment_id?: number }) {
  const params = new URLSearchParams({
    appointment_date: payload.appointment_date,
    appointment_time_from: payload.appointment_time_from,
    appointment_time_until: payload.appointment_time_until,
  });

  if (payload.appointment_id) params.set("appointment_id", String(payload.appointment_id));

  return api<CollectionResponse<AdminWorker>>(`/api/v1/workers/available?${params.toString()}`);
}

export function confirmAppointment(id: number, payload: SchedulePayload) {
  return api<ResourceResponse<AdminAppointment>>(`/api/v1/appointments/${id}/confirm`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function rescheduleAppointment(id: number, payload: SchedulePayload) {
  return api<ResourceResponse<AdminAppointment>>(`/api/v1/appointments/${id}/reschedule`, {
    method: "PATCH",
    body: JSON.stringify({ ...payload, reason: payload.reason ?? payload.remarks ?? "Appointment rescheduled." }),
  });
}

export function cancelAppointment(id: number, reason: string) {
  return api<ResourceResponse<AdminAppointment>>(`/api/v1/appointments/${id}/cancel`, {
    method: "PATCH",
    body: JSON.stringify({ reason }),
  });
}

export function markAppointmentOnTheWay(id: number) {
  return api<ResourceResponse<AdminAppointment>>(`/api/v1/appointments/${id}/on-the-way`, {
    method: "PATCH",
  });
}

export function markAppointmentInProgress(id: number) {
  return api<ResourceResponse<AdminAppointment>>(`/api/v1/appointments/${id}/in-progress`, {
    method: "PATCH",
  });
}

export function markAppointmentCompleted(id: number) {
  return api<ResourceResponse<AdminAppointment>>(`/api/v1/appointments/${id}/complete`, {
    method: "PATCH",
  });
}

export function createAppointmentQuotation(appointmentId: number, items: QuoteItemPayload[], notes = "") {
  return api(`/api/v1/quotations`, {
    method: "POST",
    body: JSON.stringify({ appointment_id: appointmentId, items, notes }),
  });
}

export function updateAppointmentQuotation(quotationId: number, items: QuoteItemPayload[], notes = "") {
  return api(`/api/v1/quotations/${quotationId}`, {
    method: "PUT",
    body: JSON.stringify({ items, notes }),
  });
}

export function updateQuotationItemStatus(itemId: number, status: string) {
  return api(`/api/v1/quotation-items/${itemId}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export function uploadQuotationItemImages(itemId: number, formData: FormData) {
  return api(`/api/v1/quotation-items/${itemId}/images`, {
    method: "POST",
    body: formData,
  });
}

export function deleteQuotationItemImage(imageId: number) {
  return api(`/api/v1/quotation-item-images/${imageId}`, {
    method: "DELETE",
  });
}

export function createWorkJobFromAppointment(appointmentId: number) {
  return api(`/api/v1/appointments/${appointmentId}/work-job`, {
    method: "POST",
  });
}
