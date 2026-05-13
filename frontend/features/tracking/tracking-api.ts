import { api } from "@/lib/api";
import type { TrackResponse } from "./types";

export async function trackReference(reference: string) {
  const params = new URLSearchParams({ reference });
  const response = await api<TrackResponse>(`/api/v1/track?${params.toString()}`, {
    skipAuth: true,
  });

  return response.data;
}
