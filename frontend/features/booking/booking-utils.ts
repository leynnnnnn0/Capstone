import type { ApiError } from "@/lib/api";
import type {
  BookingForm,
  BookingFormErrors,
  BookingTimeOption,
  PreferredTime,
} from "./types";

export const BOOKING_TIME_OPTIONS: BookingTimeOption[] = [
  { label: "Morning (8-12 AM)", value: "morning" },
  { label: "Afternoon (1-5 PM)", value: "afternoon" },
];

export function toClockTime(date = new Date()) {
  return `${String(date.getHours()).padStart(2, "0")}:${String(
    date.getMinutes(),
  ).padStart(2, "0")}`;
}

export function toIsoDate(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
    2,
    "0",
  )}-${String(date.getDate()).padStart(2, "0")}`;
}

export function minimumBookingDate(now = new Date()) {
  const date = new Date(now);

  if (toClockTime(date) > "17:00") {
    date.setDate(date.getDate() + 1);
  }

  return toIsoDate(date);
}

export function allowsMorning(date: string, now = new Date()) {
  return date !== minimumBookingDate(now) || toClockTime(now) < "12:00";
}

export function getAvailableTimeOptions(date: string, now = new Date()) {
  if (allowsMorning(date, now)) {
    return BOOKING_TIME_OPTIONS;
  }

  return BOOKING_TIME_OPTIONS.filter((option) => option.value === "afternoon");
}

export function resolvePreferredTimeForDate(
  date: string,
  currentPreferredTime: PreferredTime,
  now = new Date(),
) {
  if (allowsMorning(date, now) || currentPreferredTime === "afternoon") {
    return currentPreferredTime;
  }

  return "afternoon";
}

export function createInitialBookingForm(now = new Date()): BookingForm {
  return {
    first_name: "",
    last_name: "",
    phone_number: "",
    email: "",
    address: "",
    address_pinned: "",
    address_lat: "",
    address_lng: "",
    preferred_date: minimumBookingDate(now),
    preferred_time: "afternoon",
    service_type: "quotation",
    service_type_other: "",
    additional_notes: "",
    consent: false,
  };
}

export function flattenServerErrors(error: ApiError): BookingFormErrors {
  if (!error.errors) return { form: error.message };

  return Object.entries(error.errors).reduce<BookingFormErrors>(
    (acc, [field, value]) => {
      acc[field as keyof BookingFormErrors] = Array.isArray(value)
        ? value[0]
        : value;
      return acc;
    },
    {},
  );
}
