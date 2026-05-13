import { api } from "@/lib/api";
import type { AppointmentQuotePayload, AppointmentQuoteResponse } from "./types";

type AppointmentResponse = {
  message: string;
  data: AppointmentQuoteResponse;
};

export async function submitQuoteRequest(payload: AppointmentQuotePayload) {
  const response = await api<AppointmentResponse>("/api/v1/appointments", {
    method: "POST",
    body: JSON.stringify(payload),
    skipAuth: true,
  });

  return response.data;
}
