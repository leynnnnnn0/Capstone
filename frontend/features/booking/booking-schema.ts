import { z } from "zod";

import type { BookingForm, BookingFormErrors } from "./types";
import { allowsMorning, minimumBookingDate } from "./booking-utils";

const nameRegex = /^[A-Za-zÀ-ÖØ-öø-ÿ' -]{2,50}$/;
const phoneRegex = /^[0-9+\s().-]{10,20}$/;

export const bookingSchema = z.object({
  first_name: z
    .string()
    .trim()
    .min(1, "First name is required.")
    .regex(
      nameRegex,
      "First name must be 2-50 characters and contain only letters.",
    ),
  last_name: z
    .string()
    .trim()
    .min(1, "Last name is required.")
    .regex(
      nameRegex,
      "Last name must be 2-50 characters and contain only letters.",
    ),
  phone_number: z
    .string()
    .trim()
    .min(1, "Phone number is required.")
    .regex(phoneRegex, "Enter a valid phone number."),
  email: z.string().trim().email("Enter a valid email address."),
  address: z.string().trim().min(5, "Address is required."),
  address_pinned: z.string().optional(),
  address_lat: z.string().optional(),
  address_lng: z.string().optional(),
  preferred_date: z
    .string()
    .min(1, "Preferred date is required.")
    .refine((value) => value >= minimumBookingDate(), "Date cannot be in the past."),
  preferred_time: z.enum(["morning", "afternoon"], {
    message: "Preferred time is required.",
  }),
  service_type: z.literal("quotation"),
  service_type_other: z.string().optional(),
  additional_notes: z
    .string()
    .max(2000, "Notes must be 2000 characters or fewer."),
  consent: z.literal(true, {
    message: "You must agree to be contacted.",
  }),
}).superRefine((data, context) => {
  if (data.preferred_time === "morning" && !allowsMorning(data.preferred_date)) {
    context.addIssue({
      code: "custom",
      path: ["preferred_time"],
      message: "Morning is no longer available for this date.",
    });
  }
});

export function validateBookingForm(data: BookingForm) {
  return bookingSchema.safeParse(data);
}

export function zodIssuesToBookingErrors(
  issues: z.ZodIssue[],
): BookingFormErrors {
  return issues.reduce<BookingFormErrors>((acc, issue) => {
    const field = issue.path[0] as keyof BookingForm;
    acc[field] = issue.message;
    return acc;
  }, {});
}
