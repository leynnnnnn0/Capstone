import { api } from "@/lib/api";
import type { User } from "@/types/user";

type ResourceResponse<T> = { data: T };

export function fetchCurrentUser() {
  return api<ResourceResponse<User>>("/api/user");
}

export function primaryRole(user?: User | null) {
  return user?.roles?.[0] ?? user?.role ?? "customer";
}

export function can(user: User | null | undefined, permission: string) {
  return Boolean(user?.permissions?.includes(permission));
}

export function hasRole(user: User | null | undefined, role: string) {
  return Boolean(user?.roles?.includes(role) || user?.role === role);
}
