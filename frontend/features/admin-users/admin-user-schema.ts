import { z } from "zod";

export const adminUserSchema = z.object({
  username: z.string().min(2, "Username is required."),
  first_name: z.string().min(1, "First name is required."),
  last_name: z.string().min(1, "Last name is required."),
  email: z.string().email("Enter a valid email."),
  phone_number: z.string().optional(),
  password: z.string().optional(),
  role: z.enum(["admin", "sub_admin", "worker", "customer"]),
  permissions: z.array(z.string()),
});
