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
