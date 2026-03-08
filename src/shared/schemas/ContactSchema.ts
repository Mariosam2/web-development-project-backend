import * as z from "zod";

export const ContactSchema = z.object({
  email: z.email(),
  message: z.string().min(1, "message is required"),
});
