import * as z from "zod";

export const UserSchema = z.object({
  id: z.guid("invalid GUID format").optional(),
  googleId: z.string().optional(),
  firstname: z.string().optional().nullable(),
  lastname: z.string().optional().nullable(),
  username: z.string(),
  password: z.string().optional().nullable(),
  tokenVersion: z.number().optional(),
  email: z.email("invalid email format").min(1, "email is required"),
  image: z
    .object({
      filename: z.string(),
    })
    .optional()
    .nullable(),
});
