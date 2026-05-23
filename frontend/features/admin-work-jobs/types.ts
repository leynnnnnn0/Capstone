import type { CustomerStatus, CustomerWorkJob } from "@/features/customer/types";
import type { PaginatedResponse } from "@/features/products/types";

export type AdminWorkJob = CustomerWorkJob;
export type AdminWorkJobStatus = Extract<CustomerStatus, "pending" | "in_progress" | "completed" | "cancelled">;
export type AdminBackJobReason =
  | "unfinished_work"
  | "warranty_claim"
  | "quality_issue"
  | "missing_parts"
  | "customer_request"
  | "other";

export type AdminWorkJobFilters = {
  search?: string;
  status?: string;
  date_from?: string;
  date_to?: string;
  sort_by?: string;
  sort_dir?: "asc" | "desc";
  per_page?: string;
  page?: string;
};

export type AdminWorkJobForm = {
  appointment_id?: number | null;
  quotation_id?: number | null;
  first_name: string;
  last_name: string;
  phone_number: string;
  email: string;
  address: string;
  address_pinned: string;
  address_lat: string;
  address_lng: string;
  service_type: string;
  service_type_other: string;
  scheduled_date: string;
  scheduled_time_from: string;
  scheduled_time_until: string;
  worker_ids: number[];
  is_down_payment_required: boolean;
  down_payment_percentage: number;
  notes: string;
};

export type AdminBackJobForm = {
  scheduled_date: string;
  scheduled_time_from: string;
  scheduled_time_until: string;
  worker_ids: number[];
  back_job_reason: AdminBackJobReason;
  back_job_reason_other: string;
  back_job_details: string;
  notes: string;
};

export type WorkJobCollection = PaginatedResponse<AdminWorkJob>;
