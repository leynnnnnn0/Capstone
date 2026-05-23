import { api } from "@/lib/api";
import type { AdminPaymentCollection, AdminPaymentFilters } from "./types";

function queryString(filters: AdminPaymentFilters) {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value && value !== "all") params.set(key, value);
  });

  return params.toString();
}

export function fetchAdminPayments(filters: AdminPaymentFilters = {}) {
  const query = queryString(filters);

  return api<AdminPaymentCollection>(`/api/v1/payments${query ? `?${query}` : ""}`);
}
