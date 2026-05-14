import type { CustomerAppointment, CustomerStatus, CustomerWorker } from "@/features/customer/types";
import type { PaginatedResponse } from "@/features/products/types";
import type { QuoteItemPayload } from "@/features/quotes/types";

export type AdminAppointment = CustomerAppointment;
export type AdminWorker = CustomerWorker;
export type AdminAppointmentStatus = CustomerStatus;

export type AdminAppointmentFilters = {
  search?: string;
  status?: string;
  service_type?: string;
  date_from?: string;
  date_to?: string;
  sort_by?: string;
  sort_dir?: "asc" | "desc";
  per_page?: string;
  page?: string;
};

export type AdminAppointmentForm = {
  first_name: string;
  last_name: string;
  phone_number: string;
  email: string;
  address: string;
  address_pinned: string;
  address_lat: string;
  address_lng: string;
  preferred_date: string;
  preferred_time: "morning" | "afternoon";
  service_type: string;
  service_type_other: string;
  additional_notes: string;
  consent: boolean;
  status: "pending" | "confirmed";
  appointment_date: string;
  appointment_time_from: string;
  appointment_time_until: string;
  worker_ids: number[];
  quotation_notes?: string;
  items?: QuoteItemPayload[];
};

export type SchedulePayload = {
  appointment_date: string;
  appointment_time_from: string;
  appointment_time_until: string;
  worker_ids: number[];
  remarks?: string;
  reason?: string;
};

export type AppointmentCollection = PaginatedResponse<AdminAppointment>;
