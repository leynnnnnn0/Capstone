export type TrackingType = "appointment" | "work_job";

export type TrackingItem = {
  name: string;
  size: string | null;
  options: string[];
  pieces: number;
  total_amount: number;
  status: string | null;
};

export type TrackingRemark = {
  action: string;
  message: string;
  by: string;
  created_at: string;
};

export type TrackingResult = {
  type: TrackingType;
  reference_number: string;
  first_name: string;
  full_name: string;
  phone_number: string;
  email: string | null;
  address: string | null;
  status: string;
  preferred_date?: string | null;
  preferred_time?: string | null;
  appointment_date?: string | null;
  appointment_time_from?: string | null;
  appointment_time_until?: string | null;
  scheduled_date?: string | null;
  scheduled_time_from?: string | null;
  scheduled_time_until?: string | null;
  service_type: string | null;
  additional_notes?: string | null;
  notes?: string | null;
  has_quotation: boolean;
  items: TrackingItem[];
  grand_total: number;
  discount: number;
  quotation_notes: string | null;
  workers: string[];
  remarks: TrackingRemark[];
};

export type TrackResponse = {
  data: TrackingResult;
};
