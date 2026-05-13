import { z } from "zod";

import type { QuoteCheckoutForm, QuoteFormErrors } from "./types";

export const quoteCheckoutSchema = z.object({
  first_name: z.string().trim().min(2, "First name is required.").max(100),
  last_name: z.string().trim().min(2, "Last name is required.").max(100),
  phone_number: z.string().trim().regex(/^\+?[0-9\s\-().]{7,20}$/, "Enter a valid phone number."),
  email: z.string().trim().email("Enter a valid email address."),
  address: z.string().trim().min(5, "Service address is required."),
  address_pinned: z.string().optional(),
  address_lat: z.string().optional(),
  address_lng: z.string().optional(),
  preferred_date: z
    .string()
    .min(1, "Preferred date is required.")
    .refine((value) => new Date(value) >= new Date(new Date().toDateString()), {
      message: "Date cannot be in the past.",
    }),
  preferred_time: z.enum(["morning", "afternoon"], {
    message: "Preferred time is required.",
  }),
  additional_notes: z.string().max(2000).optional(),
  consent: z.boolean().refine(Boolean, "You must agree to be contacted."),
});

export function validateQuoteCheckout(data: QuoteCheckoutForm): QuoteFormErrors {
  const result = quoteCheckoutSchema.safeParse(data);
  if (result.success) return {};

  return result.error.issues.reduce<QuoteFormErrors>((errors, issue) => {
    const key = issue.path.join(".") as keyof QuoteFormErrors;
    errors[key] = issue.message;
    return errors;
  }, {});
}
