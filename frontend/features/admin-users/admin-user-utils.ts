import type { AdminUser, AdminUserForm, StaffRole } from "./types";

export const emptyAdminUserForm: AdminUserForm = {
  username: "",
  first_name: "",
  last_name: "",
  email: "",
  phone_number: "",
  password: "",
  role: "staff",
};

export const adminUserRoleLabels: Record<StaffRole, string> = {
  admin: "Admin",
  owner: "Owner",
  staff: "Staff",
  customer: "Customer",
};

export const adminUserRoleBadgeClasses: Record<StaffRole, string> = {
  admin: "bg-slate-800 text-white",
  owner: "bg-violet-600 text-white",
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
  };
}
