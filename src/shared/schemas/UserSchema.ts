import * as z from "zod";

export const UserSchema = z.object({
  id: z.guid("invalid GUID format").optional(),
  googleId: z.string().optional(),
  firstname: z.string().optional(),
  lastname: z.string().optional(),
  username: z.string().optional(),
  password: z.string().optional(),
  tokenVersion: z.number().optional(),
  email: z.email("invalid email format").min(1, "email is required").optional(),
  image: z.object({
    filename: z.string(),
  }),
});
