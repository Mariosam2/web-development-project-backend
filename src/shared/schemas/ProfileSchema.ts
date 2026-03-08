import * as z from "zod";

export const ProfileSettingsSchema = z.object({
  firstname: z.string().min(1, "First name is required"),
  lastname: z.string().min(1, "Last name is required"),
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.email("Invalid email address"),
  imageId: z.guid("invalid GUID format").optional(),
  imageRemoved: z
    .string()
    .transform((val) => val === "true")
    .optional(),
});
