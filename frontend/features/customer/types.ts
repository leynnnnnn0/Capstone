import type { Product } from "@/features/products/types";

export type CustomerStatus =
  | "pending"
  | "confirmed"
  | "rescheduled"
  | "on_the_way"
  | "in_progress"
  | "completed"
  | "cancelled"
  | "reopened"
  | "no_show";

export type CustomerWorker = {
  id: number;
  full_name: string;
};

export type CustomerPaymentType =
  | "down_payment"
  | "final_payment"
  | "full_payment"
  | "additional_charge";

export type CustomerPaymentMethod =
  | "paypal"
  | "cash"
  | "bank_transfer"
  | "other";

export type CustomerPaymentStatus =
  | "pending"
  | "paid"
  | "failed"
  | "cancelled"
  | "refunded";

export type CustomerPayment = {
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
  payer?: CustomerWorker | null;
  creator?: CustomerWorker | null;
};

export type CustomerWorkJobChargeType =
  | "service_fee"
  | "extra_material"
  | "extra_labor"
  | "delivery"
  | "adjustment"
  | "discount"
  | "other";

export type CustomerWorkJobChargeStatus =
  | "pending_approval"
  | "approved"
  | "waived"
  | "cancelled";

export type CustomerWorkJobCharge = {
  id: number;
  charge_number: string | null;
  work_job_id: number;
  title: string;
  description: string | null;
  type: CustomerWorkJobChargeType;
  type_label: string;
  status: CustomerWorkJobChargeStatus;
  status_label: string;
  amount: number;
  payable_amount: number;
  currency: string;
  requires_customer_approval: boolean;
  approved_at: string | null;
  customer_approved_at: string | null;
  created_at: string;
  creator?: CustomerWorker | null;
  approver?: CustomerWorker | null;
};

export type WorkJobPaymentSummary = {
  currency: string;
  quotation_total: number;
  base_quotation_total?: number;
  approved_charges_total?: number;
  discount_total?: number;
  pending_charges_total?: number;
  payable_total?: number;
  paid_amount: number;
  remaining_amount: number;
  is_fully_paid: boolean;
  down_payment_required: boolean;
  down_payment_percentage: number;
  down_payment_amount: number;
  down_payment_remaining_amount: number;
  final_payment_amount: number;
  additional_charge_amount?: number;
  next_due_type: CustomerPaymentType | null;
  next_due_amount: number;
  can_accept_payment: boolean;
};

export type CustomerQuotationOption = {
  id: number;
  product_option_group_id: number;
  product_option_id: number;
  group_name: string;
  option_name: string;
  price_modifier: number;
};

export type CustomerQuotationItem = {
  id: number;
  product_id: number | null;
  name: string;
  description: string | null;
  width: number | null;
  height: number | null;
  thickness: number | null;
  pieces: number;
  amount_per_piece: number;
  options_amount: number;
  total_amount: number;
  status: string | null;
  notes: string | null;
  product?: Product | null;
  options: CustomerQuotationOption[];
  before_images: CustomerQuotationItemImage[];
  after_images: CustomerQuotationItemImage[];
};

export type CustomerQuotationItemImage = {
  id: number;
  image_url: string;
  url?: string;
  type: string;
  caption: string | null;
  sort_order: number;
};

export type CustomerQuotation = {
  id: number;
  notes: string | null;
  discount: number;
  subtotal: number;
  total: number;
  signature_status?: "unsigned" | "signed" | "needs_resign";
  customer_signed_at?: string | null;
  customer_signature_name?: string | null;
  customer_signature_url?: string | null;
  signature_invalidated_at?: string | null;
  signature_invalidated_reason?: string | null;
  created_at?: string;
  updated_at?: string;
  items: CustomerQuotationItem[];
};

export type CustomerAppointment = {
  id: number;
  appointment_number: string;
  first_name: string;
  last_name: string;
  full_name: string;
  phone_number: string;
  email: string | null;
  address: string;
  address_pinned: string | null;
  address_lat: string | null;
  address_lng: string | null;
  preferred_date: string;
  preferred_time: "morning" | "afternoon";
  service_type: string;
  service_type_other: string | null;
  additional_notes: string | null;
  appointment_date: string | null;
  appointment_time_from: string | null;
  appointment_time_until: string | null;
  status: CustomerStatus;
  status_label: string;
  can_edit: boolean;
  can_cancel: boolean;
  created_at: string;
  workers: CustomerWorker[];
  quotation: CustomerQuotation | null;
  work_job?: {
    id: number;
    work_job_number: string;
    status: CustomerStatus;
    status_label: string;
    scheduled_date: string | null;
    scheduled_time_from: string | null;
    scheduled_time_until: string | null;
  } | null;
  remarks: CustomerRemark[];
};

export type CustomerWorkJob = {
  id: number;
  work_job_number: string;
  appointment_id: number | null;
  first_name: string;
  last_name: string;
  full_name: string;
  phone_number: string;
  email: string | null;
  address: string;
  address_pinned: string | null;
  address_lat: string | null;
  address_lng: string | null;
  service_type: string;
  service_type_other: string | null;
  scheduled_date: string | null;
  scheduled_time_from: string | null;
  scheduled_time_until: string | null;
  status: CustomerStatus;
  status_label: string;
  notes: string | null;
  is_down_payment_required: boolean;
  down_payment_percentage: number;
  payment_summary: WorkJobPaymentSummary;
  created_at: string;
  workers: CustomerWorker[];
  appointment?: CustomerAppointment | null;
  quotation?: CustomerQuotation | null;
  payments: CustomerPayment[];
  charges?: CustomerWorkJobCharge[];
  remarks: CustomerRemark[];
};

export type CustomerRemark = {
  id: number;
  action: CustomerStatus | string;
  message: string | null;
  created_at: string;
  user: CustomerWorker | null;
};

export type CustomerAppointmentForm = {
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
};

export type CustomerAppointmentPayload = CustomerAppointmentForm & {
  items?: import("@/features/quotes/types").QuoteItemPayload[];
};
