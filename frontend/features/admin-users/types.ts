import type { PaginatedResponse } from "@/features/products/types";

export type StaffRole = "admin" | "owner" | "staff" | "customer";

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
};

export type UserOptions = {
  roles: StaffRole[];
};

export type UserCollection = PaginatedResponse<AdminUser>;
