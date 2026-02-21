import * as z from "zod";

export const RegisterSchema = z
  .object({
    firstname: z.string().min(1, "Firstname cannot be empty"),
    lastname: z.string().min(1, "Lastname cannot be empty"),
    username: z.string().min(4, "Username must be at least 4 characters"),
    email: z.email("Invalid email format: example@mail.com"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(64, "Password must be at most 64 characters")
      .regex(/[A-Z]/, "Must contain an uppercase letter")
      .regex(/[a-z]/, "Must contain a lowercase letter")
      .regex(/[0-9]/, "Must contain a number")
      .regex(/[^A-Za-z0-9]/, "Must contain a special character"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "passwords mismatch",
    path: ["confirmPassword"],
  });
