import { z } from "zod";

import { allowsMorning, minimumBookingDate } from "@/features/booking/booking-utils";
import {
  personNameSchema,
  philippineMobileSchema,
  requiredDateSchema,
  requiredEmailSchema,
  zodIssuesToFieldErrors,
} from "@/features/forms/validation";
import type { QuoteCheckoutForm, QuoteFormErrors } from "./types";

export const quoteCheckoutSchema = z.object({
  first_name: personNameSchema("First name"),
  last_name: personNameSchema("Last name"),
  phone_number: philippineMobileSchema(),
  email: requiredEmailSchema(),
  address: z.string().trim().min(5, "Service address is required."),
  address_pinned: z.string().optional(),
  address_lat: z.string().optional(),
  address_lng: z.string().optional(),
  preferred_date: requiredDateSchema("Preferred date")
    .refine((value) => value >= minimumBookingDate(), "Date cannot be in the past."),
  preferred_time: z.enum(["morning", "afternoon"], {
    message: "Preferred time is required.",
  }),
  additional_notes: z.string().max(2000).optional(),
  consent: z.boolean().refine(Boolean, "You must agree to be contacted."),
}).superRefine((data, context) => {
  if (data.preferred_time === "morning" && !allowsMorning(data.preferred_date)) {
    context.addIssue({
      code: "custom",
      path: ["preferred_time"],
      message: "Morning is no longer available for this date.",
    });
  }
});

export function parseQuoteCheckout(data: QuoteCheckoutForm) {
  return quoteCheckoutSchema.safeParse(data);
}

export function validateQuoteCheckout(data: QuoteCheckoutForm): QuoteFormErrors {
  const result = parseQuoteCheckout(data);
  if (result.success) return {};

  return zodIssuesToFieldErrors<keyof QuoteFormErrors>(result.error.issues) as QuoteFormErrors;
}
