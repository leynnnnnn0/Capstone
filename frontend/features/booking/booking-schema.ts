import { z } from "zod";

import type { BookingForm, BookingFormErrors } from "./types";
import { allowsMorning, minimumBookingDate } from "./booking-utils";
import {
  personNameSchema,
  philippineMobileSchema,
  requiredDateSchema,
  requiredEmailSchema,
} from "@/features/forms/validation";

export const bookingSchema = z.object({
  first_name: personNameSchema("First name"),
  last_name: personNameSchema("Last name"),
  phone_number: philippineMobileSchema(),
  email: requiredEmailSchema(),
  address: z.string().trim().min(5, "Address is required."),
  address_pinned: z.string().optional(),
  address_lat: z.string().optional(),
  address_lng: z.string().optional(),
  preferred_date: requiredDateSchema("Preferred date")
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
