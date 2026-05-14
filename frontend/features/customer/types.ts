export type CustomerStatus =
  | "pending"
  | "confirmed"
  | "rescheduled"
  | "on_the_way"
  | "in_progress"
  | "completed"
  | "cancelled"
  | "no_show";

export type CustomerWorker = {
  id: number;
  full_name: string;
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
  created_at: string;
  workers: CustomerWorker[];
  appointment?: CustomerAppointment | null;
  quotation?: CustomerQuotation | null;
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
