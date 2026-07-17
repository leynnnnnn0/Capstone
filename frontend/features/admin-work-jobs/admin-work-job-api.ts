import { api } from "@/lib/api";
import type { AdminWorker } from "@/features/admin-appointments/types";
import type {
  AdminWorkJob,
  AdminBackJobForm,
  AdminWorkJobFilters,
  AdminWorkJobForm,
  WorkJobCollection,
  AdminFabricationUpdate,
} from "./types";
import type { CustomerPaymentMethod, CustomerPaymentType } from "@/features/customer/types";
import type {
  CustomerWorkJobChargeStatus,
  CustomerWorkJobChargeType,
} from "@/features/customer/types";

type ResourceResponse<T> = { data: T };
type StatusPayload = { remarks?: string };

function queryString(filters: AdminWorkJobFilters = {}) {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value && value !== "all") params.set(key, value);
  });

  return params.toString();
}

export function fetchAdminWorkJobs(filters: AdminWorkJobFilters = {}) {
  const query = queryString(filters);
  return api<WorkJobCollection | AdminWorkJob[]>(`/api/v1/work-jobs${query ? `?${query}` : ""}`).then((response) => {
    if (Array.isArray(response)) return { data: response };

    return response;
  });
}

export function fetchAdminWorkJob(id: string | number) {
  return api<ResourceResponse<AdminWorkJob>>(`/api/v1/work-jobs/${id}`);
}

export function createAdminWorkJob(payload: AdminWorkJobForm) {
  return api<ResourceResponse<AdminWorkJob>>("/api/v1/work-jobs", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateAdminWorkJob(id: string | number, payload: AdminWorkJobForm) {
  return api<ResourceResponse<AdminWorkJob>>(`/api/v1/work-jobs/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function updateWorkJobFabrication(id: number, payload: AdminFabricationUpdate) {
  return api<ResourceResponse<AdminWorkJob>>(`/api/v1/work-jobs/${id}/fabrication`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function createBackJob(id: number, payload: AdminBackJobForm) {
  return api<ResourceResponse<AdminWorkJob>>(`/api/v1/work-jobs/${id}/back-jobs`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function confirmWorkJob(id: number, payload: StatusPayload = {}) {
  return api<ResourceResponse<AdminWorkJob>>(`/api/v1/work-jobs/${id}/confirm`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function markWorkJobOnTheWay(id: number, payload: StatusPayload = {}) {
  return api<ResourceResponse<AdminWorkJob>>(`/api/v1/work-jobs/${id}/on-the-way`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function markWorkJobInProgress(id: number, payload: StatusPayload = {}) {
  return api<ResourceResponse<AdminWorkJob>>(`/api/v1/work-jobs/${id}/in-progress`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function markWorkJobCompleted(id: number, payload: StatusPayload = {}) {
  return api<ResourceResponse<AdminWorkJob>>(`/api/v1/work-jobs/${id}/complete`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function cancelWorkJob(id: number, payload: StatusPayload = {}) {
  return api<ResourceResponse<AdminWorkJob>>(`/api/v1/work-jobs/${id}/cancel`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function reopenWorkJob(id: number, payload: StatusPayload = {}) {
  return api<ResourceResponse<AdminWorkJob>>(`/api/v1/work-jobs/${id}/reopen`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function markWorkJobNoShow(id: number, payload: StatusPayload = {}) {
  return api<ResourceResponse<AdminWorkJob>>(`/api/v1/work-jobs/${id}/no-show`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function recordManualWorkJobPayment(
  id: number,
  payload: {
    type: CustomerPaymentType;
    method: Exclude<CustomerPaymentMethod, "paypal">;
    amount: number;
    paid_at?: string;
    remarks?: string;
  },
) {
  return api<ResourceResponse<AdminWorkJob>>(`/api/v1/work-jobs/${id}/payments/manual`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export type WorkJobChargePayload = {
  title: string;
  description?: string;
  type: CustomerWorkJobChargeType;
  status?: CustomerWorkJobChargeStatus;
  amount: number;
  requires_customer_approval?: boolean;
};

export function createWorkJobCharge(id: number, payload: WorkJobChargePayload) {
  return api<ResourceResponse<AdminWorkJob>>(`/api/v1/work-jobs/${id}/charges`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateWorkJobCharge(
  id: number,
  chargeId: number,
  payload: Partial<WorkJobChargePayload>,
) {
  return api<ResourceResponse<AdminWorkJob>>(`/api/v1/work-jobs/${id}/charges/${chargeId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function cancelWorkJobCharge(id: number, chargeId: number, payload: { remarks?: string } = {}) {
  return api<ResourceResponse<AdminWorkJob>>(`/api/v1/work-jobs/${id}/charges/${chargeId}/cancel`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function fetchWorkJobWorkers() {
  return api<{ data: AdminWorker[] }>("/api/v1/workers");
}
