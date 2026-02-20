import * as z from "zod";

const WorkoutSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  duration: z.number().positive().optional(),
  exercises: z
    .array(
      z.object({
        name: z.string(),
        sets: z.number().int().positive(),
        reps: z.number().int().positive(),
      }),
    )
    .optional(),
});
