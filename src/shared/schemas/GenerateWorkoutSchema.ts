import * as z from "zod";

export const GenerateWorkoutSchema = z.object({
  weight: z.number().int().positive(),
  height: z.number().int().positive(),
  age: z.number().int().positive(),
  level: z.enum(["beginner", "intermediate", "advanced"]),
  goal: z.string().optional(),
  targetMuscles: z.array(z.string()),
  equipments: z.array(z.string()),
  notes: z.string().optional(),
});
