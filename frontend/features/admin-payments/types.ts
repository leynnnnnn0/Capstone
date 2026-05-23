import type {
  CustomerPaymentMethod,
  CustomerPaymentStatus,
  CustomerPaymentType,
  CustomerWorker,
} from "@/features/customer/types";

export type AdminPaymentWorkJob = {
  id: number;
  work_job_number: string;
  full_name: string;
  phone_number: string | null;
  email: string | null;
  status: string | null;
  status_label: string | null;
  scheduled_date: string | null;
  scheduled_time_from: string | null;
  scheduled_time_until: string | null;
  workers: CustomerWorker[];
};

export type AdminPaymentQuotation = {
  id: number;
  total: number;
};

export type AdminPayment = {
  id: number;
  payment_number: string | null;
  work_job_id: number;
  quotation_id: number | null;
  type: CustomerPaymentType;
  type_label: string;
  method: CustomerPaymentMethod;
  method_label: string;
  status: CustomerPaymentStatus;
  status_label: string;
  amount: number;
  currency: string;
  provider: string | null;
  provider_order_id: string | null;
  provider_capture_id: string | null;
  provider_payer_email: string | null;
  paid_at: string | null;
  remarks: string | null;
  created_at: string;
  work_job?: AdminPaymentWorkJob | null;
  quotation?: AdminPaymentQuotation | null;
  payer?: CustomerWorker | null;
  creator?: CustomerWorker | null;
};

export type AdminPaymentSummary = {
  total_count: number;
  paid_count: number;
  pending_count: number;
  failed_count: number;
  refunded_count: number;
  total_paid: number;
};

export type AdminPaymentOption = {
  value: string;
  label: string;
};

export type AdminPaymentCollection = {
  data: AdminPayment[];
  meta?: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
  };
  summary: AdminPaymentSummary;
  options: {
    statuses: AdminPaymentOption[];
    methods: AdminPaymentOption[];
    types: AdminPaymentOption[];
  };
};

export type AdminPaymentFilters = {
  search?: string;
  status?: string;
  method?: string;
  type?: string;
  date_from?: string;
  date_to?: string;
  per_page?: string;
  page?: string;
};
