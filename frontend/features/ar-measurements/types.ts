export type ArMeasurementConfidence = "none" | "weak" | "medium" | "high";

export type ArMeasurementSessionStatus =
  | "submitted"
  | "reviewed"
  | "approved"
  | "needs_retake";

export type ArMeasurementObjectType =
  | "door"
  | "window"
  | "cabinet"
  | "shower"
  | "other";

export type ArMeasurementPerson = {
  id: number;
  full_name: string;
};

export type ArMeasurement = {
  id: number;
  product_id: number | null;
  object_type: ArMeasurementObjectType;
  model_id: string | null;
  label: string;
  segments_cm: number[];
  width_cm: number;
  height_cm: number;
  depth_cm: number | null;
  unit: "cm";
  confidence: ArMeasurementConfidence | null;
  points_count: number | null;
  metadata: Record<string, unknown> | null;
  area_sqm: number;
};

export type ArMeasurementSession = {
  id: number;
  reference: string;
  appointment_id: number;
  customer_id: number | null;
  created_by: ArMeasurementPerson | null;
  source: string;
  status: ArMeasurementSessionStatus;
  status_label: string;
  capture_version: "v1" | "v2" | "v3";
  capture_mode: string;
  overall_confidence: ArMeasurementConfidence;
  device_metadata: Record<string, unknown> | null;
  captured_at: string;
  review_notes: string | null;
  reviewed_at: string | null;
  reviewed_by: ArMeasurementPerson | null;
  measurements_count: number;
  measurements: ArMeasurement[];
  created_at: string;
  updated_at: string;
};

export type ArMeasurementSummary = {
  reference: string;
  status: ArMeasurementSessionStatus;
  status_label: string;
  appointment: {
    id: number;
    appointment_number: string;
    customer_name: string;
    service_type: string;
    address: string;
  };
  capture: {
    capture_version: "v1" | "v2" | "v3";
    capture_mode: string;
    overall_confidence: ArMeasurementConfidence;
    device_metadata: Record<string, unknown> | null;
    captured_at: string;
    source: string;
    created_by: ArMeasurementPerson | null;
  };
  review: {
    review_notes: string | null;
    reviewed_at: string | null;
    reviewed_by: ArMeasurementPerson | null;
  };
  object_count: number;
  totals: {
    total_linear_m: number;
    total_area_sqm: number;
  };
  confidence_distribution: Partial<Record<ArMeasurementConfidence, number>>;
  by_type: Array<{
    object_type: ArMeasurementObjectType;
    count: number;
    total_linear_m: number;
    total_area_sqm: number;
  }>;
  measurements: ArMeasurement[];
};

export type ReviewArMeasurementSessionPayload = {
  status: Exclude<ArMeasurementSessionStatus, "submitted">;
  review_notes?: string;
};

export type ArMeasurementSessionCollection = {
  data: ArMeasurementSession[];
  meta?: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
};

export type ArMeasurementResourceResponse<T> = {
  data: T;
};
