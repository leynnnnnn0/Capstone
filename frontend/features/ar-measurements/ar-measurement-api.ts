import { api } from "@/lib/api";

import type {
  ArMeasurementResourceResponse,
  ArMeasurementSession,
  ArMeasurementSessionCollection,
  ArMeasurementSummary,
  ReviewArMeasurementSessionPayload,
} from "./types";

export function fetchAppointmentMeasurementSessions(
  appointmentId: string | number,
  audience: "staff" | "customer",
) {
  const endpoint =
    audience === "customer"
      ? `/api/v1/customer/appointments/${appointmentId}/measurement-sessions`
      : `/api/v1/appointments/${appointmentId}/measurement-sessions`;

  return api<ArMeasurementSessionCollection>(endpoint);
}

export function fetchArMeasurementSession(reference: string) {
  return api<ArMeasurementResourceResponse<ArMeasurementSession>>(
    `/api/v1/ar-measurement-sessions/${encodeURIComponent(reference)}`,
  );
}

export function fetchArMeasurementSummary(reference: string) {
  return api<ArMeasurementResourceResponse<ArMeasurementSummary>>(
    `/api/v1/ar-measurement-sessions/${encodeURIComponent(reference)}/summary`,
  );
}

export function reviewArMeasurementSession(
  reference: string,
  payload: ReviewArMeasurementSessionPayload,
) {
  return api<ArMeasurementResourceResponse<ArMeasurementSession>>(
    `/api/v1/ar-measurement-sessions/${encodeURIComponent(reference)}/review`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    },
  );
}
