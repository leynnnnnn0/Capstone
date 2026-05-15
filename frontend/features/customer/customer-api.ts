import { api } from "@/lib/api";

import type {
  CustomerAppointment,
  CustomerAppointmentPayload,
  CustomerQuotation,
  CustomerWorkJob,
} from "./types";

type CollectionResponse<T> = { data: T[] };
type ResourceResponse<T> = { data: T };

export function getCustomerAppointments() {
  return api<CollectionResponse<CustomerAppointment>>("/api/v1/customer/appointments");
}

export function getCustomerAppointment(id: string | number) {
  return api<ResourceResponse<CustomerAppointment>>(`/api/v1/customer/appointments/${id}`);
}

export function createCustomerAppointment(payload: CustomerAppointmentPayload) {
  return api<ResourceResponse<CustomerAppointment>>("/api/v1/customer/appointments", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateCustomerAppointment(id: string | number, payload: CustomerAppointmentPayload) {
  return api<ResourceResponse<CustomerAppointment>>(`/api/v1/customer/appointments/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function cancelCustomerAppointment(id: string | number, reason: string) {
  return api<ResourceResponse<CustomerAppointment>>(`/api/v1/customer/appointments/${id}/cancel`, {
    method: "PATCH",
    body: JSON.stringify({ reason }),
  });
}

export function signCustomerQuotation(
  quotationId: string | number,
  payload: { signer_name: string; signature: string },
) {
  return api<ResourceResponse<CustomerQuotation>>(`/api/v1/customer/quotations/${quotationId}/sign`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function getCustomerWorkJobs() {
  return api<CollectionResponse<CustomerWorkJob>>("/api/v1/customer/work-jobs");
}

export function getCustomerWorkJob(id: string | number) {
  return api<ResourceResponse<CustomerWorkJob>>(`/api/v1/customer/work-jobs/${id}`);
}
