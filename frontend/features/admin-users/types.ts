import type { PaginatedResponse } from "@/features/products/types";

export type StaffRole = "admin" | "sub_admin" | "worker" | "customer";

export type AdminUser = {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  full_name: string;
  email: string;
  phone_number: string | null;
  role: StaffRole;
  roles: StaffRole[];
  permissions: string[];
  created_at: string;
  updated_at: string;
};

export type AdminUserForm = {
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  password: string;
  role: StaffRole;
  permissions: string[];
};

export type UserOptions = {
  roles: StaffRole[];
  permissions: string[];
};

export type UserCollection = PaginatedResponse<AdminUser>;
