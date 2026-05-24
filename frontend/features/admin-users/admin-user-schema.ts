import { z } from "zod";

import {
  optionalPhilippineMobileSchema,
  personNameSchema,
  requiredEmailSchema,
} from "@/features/forms/validation";

export const adminUserSchema = z.object({
  username: z
    .string()
    .trim()
    .min(2, "Username is required.")
    .max(50, "Username must be 50 characters or fewer.")
    .regex(/^[a-zA-Z0-9._-]+$/, "Username can only contain letters, numbers, dots, underscores, and hyphens."),
  first_name: personNameSchema("First name"),
  last_name: personNameSchema("Last name"),
  email: requiredEmailSchema(),
  phone_number: optionalPhilippineMobileSchema(),
  password: z.string().optional(),
  role: z.enum(["admin", "sub_admin", "worker", "customer"]),
  permissions: z.array(z.string()),
});
