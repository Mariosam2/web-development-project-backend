import * as z from "zod";
export const AIWorkoutSchema = z.object({
  title: z.string(),
  estimatedDuration: z.number(),
  exercises: z.array(
    z.object({
      exerciseId: z.string(),
      name: z.string(),
      bodyParts: z.array(z.string()).default([]),
      equipments: z.array(z.string()).default([]),
      exerciseType: z.string(),
      targetMuscles: z.array(z.string()).default([]),
      secondaryMuscles: z.array(z.string()).default([]),
      keywords: z.array(z.string()).default([]),
      reps: z.number().int().positive(),
      sets: z.number().int().positive(),
    }),
  ),
});
