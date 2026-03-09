import * as z from "zod";

export const ExerciseSchema = z.object({
  id: z.string().optional(),
  exerciseId: z.string().min(20, "Invalid exerciseId"),
  name: z.string().min(1, "name is required"),
  imageUrl: z.string().optional(),
  bodyParts: z.array(z.string()).default([]),
  equipments: z.array(z.string()).default([]),
  exerciseType: z.string().min(1, "exerciseType is required"),
  targetMuscles: z.array(z.string()).default([]),
  secondaryMuscles: z.array(z.string()).default([]),
  keywords: z.array(z.string()).default([]),
  reps: z.number().int().positive().optional(),
  sets: z.number().int().positive().optional(),
});
