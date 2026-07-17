import { api } from "@/lib/api";
import type { AdminUser, AdminUserForm, UserCollection, UserOptions } from "./types";

type ResourceResponse<T> = { data: T };

export type AdminUserFilters = {
  search?: string;
  role?: string;
  email_status?: string;
  phone_status?: string;
  two_factor?: string;
  created_from?: string;
  created_to?: string;
};

export function fetchAdminUsers(filters: AdminUserFilters = {}) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value && value !== "all") params.set(key, value);
  });

  return api<UserCollection>(`/api/v1/users${params.toString() ? `?${params.toString()}` : ""}`);
}

export function fetchUserOptions() {
  return api<UserOptions>("/api/v1/users/options");
}

export function fetchAdminUser(id: number | string) {
  return api<ResourceResponse<AdminUser>>(`/api/v1/users/${id}`).then((response) => response.data);
}

export function createAdminUser(payload: AdminUserForm) {
  return api<ResourceResponse<AdminUser>>("/api/v1/users", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateAdminUser(id: number, payload: AdminUserForm) {
  return api<ResourceResponse<AdminUser>>(`/api/v1/users/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function deleteAdminUser(id: number) {
  return api(`/api/v1/users/${id}`, {
    method: "DELETE",
  });
}
