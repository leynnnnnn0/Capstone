import { api } from "@/lib/api";
import type { AdminWorker } from "@/features/admin-appointments/types";
import type {
  AdminWorkJob,
  AdminWorkJobFilters,
  AdminWorkJobForm,
  WorkJobCollection,
} from "./types";

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

export function fetchWorkJobWorkers() {
  return api<{ data: AdminWorker[] }>("/api/v1/workers");
}
