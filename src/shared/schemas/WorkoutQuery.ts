import { z } from "zod";

export const workoutQuerySchema = z.object({
  limit: z.coerce.number().int().positive(),
  query: z.string().optional(),
  isCompleted: z
    .string()
    .optional()
    .transform((val) => (val !== undefined ? val === "true" : undefined)),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
});
