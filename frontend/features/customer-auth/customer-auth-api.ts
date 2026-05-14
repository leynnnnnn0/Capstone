import { api } from "@/lib/api";

import type {
  RequestCustomerOtpResponse,
  VerifyCustomerOtpResponse,
} from "./types";

export function requestCustomerOtp(contact: string) {
  return api<RequestCustomerOtpResponse>("/api/customer/request-otp", {
    method: "POST",
    skipAuth: true,
    body: JSON.stringify({ contact }),
  });
}

export function verifyCustomerOtp(contact: string, code: string) {
  return api<VerifyCustomerOtpResponse>("/api/customer/verify-otp", {
    method: "POST",
    skipAuth: true,
    body: JSON.stringify({ contact, code }),
  });
}
