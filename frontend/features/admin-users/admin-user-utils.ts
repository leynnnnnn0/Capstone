import type { AdminUser, AdminUserForm, StaffRole } from "./types";

export const emptyAdminUserForm: AdminUserForm = {
  username: "",
  first_name: "",
  last_name: "",
  email: "",
  phone_number: "",
  password: "",
  role: "staff",
  permissions: [],
};

export const adminUserRoleLabels: Record<StaffRole, string> = {
  admin: "Admin",
  sub_admin: "Sub Admin",
  staff: "Staff",
  customer: "Customer",
};

export const adminUserRoleBadgeClasses: Record<StaffRole, string> = {
  admin: "bg-slate-800 text-white",
  sub_admin: "bg-violet-600 text-white",
  staff: "bg-emerald-600 text-white",
  customer: "bg-blue-600 text-white",
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
