import { api } from "@/lib/api";
import type { CustomerPaymentMethod } from "@/features/customer/types";
import type { AdminPayment, AdminPaymentCollection, AdminPaymentFilters } from "./types";

export type RefundAdminPaymentPayload = {
  amount: number;
  method?: CustomerPaymentMethod;
  reason: string;
};

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

export function refundAdminPayment(paymentId: number, payload: RefundAdminPaymentPayload) {
  return api<{ data: AdminPayment }>(`/api/v1/payments/${paymentId}/refund`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
