import * as z from "zod";
import { ExerciseSchema } from "./ExerciseSchema";

export const WorkoutSchema = z.object({
  title: z.string().min(1, "title is required"),
  estimatedDuration: z.number().positive().optional(),
  exercises: z.array(ExerciseSchema),
});
