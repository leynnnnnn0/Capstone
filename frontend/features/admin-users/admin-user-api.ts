import { api } from "@/lib/api";
import type { AdminUser, AdminUserForm, UserCollection, UserOptions } from "./types";

type ResourceResponse<T> = { data: T };

export function fetchAdminUsers(filters: { search?: string; role?: string } = {}) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value && value !== "all") params.set(key, value);
  });

  return api<UserCollection>(`/api/v1/users${params.toString() ? `?${params.toString()}` : ""}`);
}

export function fetchUserOptions() {
  return api<UserOptions>("/api/v1/users/options");
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
