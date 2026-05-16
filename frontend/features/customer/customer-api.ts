import { api } from "@/lib/api";

import type {
  CustomerAppointment,
  CustomerAppointmentPayload,
  CustomerQuotation,
  CustomerWorkJob,
} from "./types";
import type { PaginatedResponse } from "@/features/products/types";

type CollectionResponse<T> = { data: T[] };
type ResourceResponse<T> = { data: T };

type CustomerListFilters = {
  page?: string | number;
  per_page?: string | number;
};

function queryString(filters: CustomerListFilters = {}) {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") params.set(key, String(value));
  });

  return params.toString();
}

export function getCustomerAppointments(filters: CustomerListFilters = {}) {
  const query = queryString(filters);
  return api<PaginatedResponse<CustomerAppointment>>(`/api/v1/customer/appointments${query ? `?${query}` : ""}`);
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

export function getCustomerWorkJobs(filters: CustomerListFilters = {}) {
  const query = queryString(filters);
  return api<PaginatedResponse<CustomerWorkJob>>(`/api/v1/customer/work-jobs${query ? `?${query}` : ""}`);
}

export function getCustomerWorkJob(id: string | number) {
  return api<ResourceResponse<CustomerWorkJob>>(`/api/v1/customer/work-jobs/${id}`);
}
