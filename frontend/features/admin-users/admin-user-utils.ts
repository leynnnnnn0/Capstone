import type { AdminUser, AdminUserForm, StaffRole } from "./types";

export const emptyAdminUserForm: AdminUserForm = {
  username: "",
  first_name: "",
  last_name: "",
  email: "",
  phone_number: "",
  password: "",
  role: "worker",
  permissions: [],
};

export const adminUserRoleLabels: Record<StaffRole, string> = {
  admin: "Admin",
  sub_admin: "Sub Admin",
  worker: "Worker",
  customer: "Customer",
};

export function adminUserToForm(user: AdminUser): AdminUserForm {
  return {
    username: user.username,
    first_name: user.first_name,
    last_name: user.last_name,
    email: user.email,
    phone_number: user.phone_number ?? "",
    password: "",
    role: user.role,
    permissions: user.permissions ?? [],
  };
}

export function adminPermissionLabel(permission: string) {
  return permission
    .split(".")
    .map((part) => part.replaceAll("-", " "))
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" / ");
}
