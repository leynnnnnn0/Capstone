import { z } from "zod";

import {
  nonNegativeNumberStringSchema,
  positiveNumberStringSchema,
} from "@/features/forms/validation";
import type { ProductFormErrors, ProductFormState } from "./types";

export const productFormSchema = z.object({
  name: z.string().trim().min(1, "Product name is required.").max(255),
  description: z.string().trim().min(1, "Description is required."),
  category_ids: z.array(z.number()).min(1, "Select at least one category."),
  unit: z.enum(["sqm", "meter", "piece", "set"], {
    message: "Select a unit.",
  }),
  price_per_unit: nonNegativeNumberStringSchema("Price per unit"),
  is_active: z.boolean(),
  images: z.array(z.unknown()),
  deleted_image_ids: z.array(z.number()),
  model_3d: z.unknown().nullable(),
  existing_3d_model: z.unknown().nullable(),
  delete_3d_model: z.boolean(),
  warranty: z.object({
    duration_months: z
      .string()
      .trim()
      .min(1, "Warranty duration is required.")
      .regex(/^\d+$/, "Warranty duration must be a whole number.")
      .refine((value) => Number(value) >= 1, "Warranty duration must be at least 1 month.")
      .refine((value) => Number(value) <= 120, "Warranty duration cannot exceed 120 months."),
    is_active: z.boolean(),
    coverage: z
      .string()
      .trim()
      .max(5000, "Warranty coverage must be 5,000 characters or less."),
    terms: z
      .string()
      .trim()
      .max(5000, "Warranty terms must be 5,000 characters or less."),
  }),
  variants: z.array(
    z.object({
      id: z.string(),
      width: positiveNumberStringSchema("Width"),
      height: positiveNumberStringSchema("Height"),
      price: nonNegativeNumberStringSchema("Variant price"),
      images: z.array(z.unknown()),
      existing_images: z.array(z.unknown()).optional(),
      deleted_image_ids: z.array(z.number()).optional(),
    }),
  ),
  option_groups: z.array(
    z.object({
      id: z.string(),
      name: z.string().trim().min(1, "Group name is required."),
      is_required: z.boolean(),
      sort_order: z.number(),
      options: z
        .array(
          z.object({
            id: z.string(),
            name: z.string().trim().min(1, "Option name is required."),
            price_modifier: nonNegativeNumberStringSchema("Price modifier"),
            sort_order: z.number(),
            is_active: z.boolean(),
          }),
        )
        .min(1, "Add at least one option."),
    }),
  ),
});

export function validateProductForm(data: ProductFormState): ProductFormErrors {
  const parsed = productFormSchema.safeParse(data);
  if (parsed.success) return {};

  return parsed.error.issues.reduce<ProductFormErrors>((errors, issue) => {
    const key = issue.path.join(".") as keyof ProductFormErrors;
    errors[key] = issue.message;
    return errors;
  }, {});
}
