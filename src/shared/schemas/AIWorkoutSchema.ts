import * as z from "zod";
export const AIWorkoutSchema = z.object({
  title: z.string(),
  estimatedDuration: z.number(),
  exercises: z.array(
    z.object({
      exerciseId: z.string(),
      name: z.string(),
      bodyParts: z.array(z.string()),
      equipments: z.array(z.string()),
      exerciseType: z.string(),
      targetMuscles: z.array(z.string()),
      secondaryMuscles: z.array(z.string()),
      keywords: z.array(z.string()),
      reps: z.number(),
      sets: z.number(),
    }),
  ),
});
