import * as z from "zod";

export const ExerciseSchema = z.object({
  id: z.guid("invalid GUID format").optional(),
  title: z.string().min(1, "title is required"),
  description: z.string().optional(),
  name: z.string().min(1, "name is required"),
  bodyPart: z.string().optional(),
  targetMuscle: z.string().optional(),
  reps: z.number().int().positive(),
  sets: z.number().int().positive(),
  imageUrl: z.string().optional(),
  videoUrl: z.string().optional(),
});
