export type SalesSummary = {
  gross_sales: number;
  net_sales: number;
  pending_amount: number;
  refunded_amount: number;
  outstanding_amount: number;
  additional_charges_paid: number;
  paid_count: number;
  pending_count: number;
  failed_count: number;
  refunded_count: number;
  average_payment: number;
  collection_rate: number;
};

export type SalesPeriodPoint = {
  period: string;
  sales: number;
  pending: number;
  payments: number;
};

export type SalesBreakdownPoint = {
  value: number;
  count: number;
};

export type SalesPaymentMethodPoint = SalesBreakdownPoint & {
  method: string;
};

export type SalesPaymentTypePoint = SalesBreakdownPoint & {
  type: string;
};

export type SalesStatusPoint = SalesBreakdownPoint & {
  status: string;
};

export type SalesTopProduct = {
  name: string;
  revenue: number;
  pieces: number;
  line_count: number;
};

export type SalesPaymentRow = {
  id: number;
  payment_number: string | null;
  work_job_id: number | null;
  work_job_number: string | null;
  customer: string | null;
  phone: string | null;
  email: string | null;
  type: string | null;
  type_label: string | null;
  method: string | null;
  method_label: string | null;
  status: string | null;
  status_label: string | null;
  amount: number;
  currency: string;
  provider_capture_id: string | null;
  recorded_at: string | null;
  schedule: string | null;
};

export type SalesTopCustomer = {
  name: string;
  contact: string | null;
  payments: number;
  total_paid: number;
};

export type SalesTopWorkJob = {
  id: number | null;
  work_job_number: string;
  customer: string | null;
  schedule: string | null;
  payments: number;
  total_paid: number;
};

export type SalesOutstandingWorkJob = {
  id: number;
  work_job_number: string;
  customer: string;
  status: string | null;
  status_label: string | null;
  schedule: string | null;
  payable_total: number;
  paid_amount: number;
  remaining_amount: number;
  next_due_type: string | null;
  next_due_amount: number;
};

export type SalesExportRow = Record<string, string | number | null>;

export type SalesReport = {
  summary: SalesSummary;
  charts: {
    sales_by_period: SalesPeriodPoint[];
    payment_methods: SalesPaymentMethodPoint[];
    payment_types: SalesPaymentTypePoint[];
    status_breakdown: SalesStatusPoint[];
    top_products: SalesTopProduct[];
  };
  tables: {
    recent_payments: SalesPaymentRow[];
    top_customers: SalesTopCustomer[];
    top_work_jobs: SalesTopWorkJob[];
    outstanding_work_jobs: SalesOutstandingWorkJob[];
  };
  export_rows: SalesExportRow[];
  filters: SalesFilters;
};

export type SalesFilters = {
  date_from?: string | null;
  date_to?: string | null;
  group_by?: "day" | "month";
};
