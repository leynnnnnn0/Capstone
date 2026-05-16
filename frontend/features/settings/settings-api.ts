import { api } from "@/lib/api";
import type { User } from "@/types/user";

type ResourceResponse<T> = { data: T };

export type ProfilePayload = {
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
};

export type PasswordPayload = {
  current_password: string; 
  password: string;
  password_confirmation: string;
};

export function updateProfile(payload: ProfilePayload) {
  return api<void>("/api/user/profile-information", {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function updatePassword(payload: PasswordPayload) {
  return api<void>("/api/user/password", {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function fetchProfileUser() {
  return api<ResourceResponse<User>>("/api/user");
}

export function confirmPassword(password: string) {
  return api<void>("/api/user/confirm-password", {
    method: "POST",
    body: JSON.stringify({ password }),
  });
}

export function enableTwoFactor() {
  return api<void>("/api/user/two-factor-authentication", {
    method: "POST",
  });
}
 
export function confirmTwoFactor(code: string) {
  return api<void>("/api/user/confirmed-two-factor-authentication", {
    method: "POST",
    body: JSON.stringify({ code }),
  });
}

export function disableTwoFactor() {
  return api<void>("/api/user/two-factor-authentication", {
    method: "DELETE",
  });
}

export function fetchTwoFactorQrCode() {
  return api<{ svg: string }>("/api/user/two-factor-qr-code");
}

export function fetchTwoFactorRecoveryCodes() {
  return api<string[]>("/api/user/two-factor-recovery-codes");
}

export function regenerateTwoFactorRecoveryCodes() {
  return api<void>("/api/user/two-factor-recovery-codes", {
    method: "POST",
  });
}
