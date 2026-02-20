import * as z from "zod";

export const LoginSchema = z
  .object({
    username: z.string().optional(),
    email: z.email().optional(),
    password: z.string().min(6),
  })
  .refine((data) => data.username || data.email, { message: "username or email is required" });
