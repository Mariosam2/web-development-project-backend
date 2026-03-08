import * as z from "zod";
import { ExerciseSchema } from "./ExerciseSchema";

export const WorkoutSchema = z.object({
  id: z.guid("invalid GUID format").optional(),
  title: z.string().min(1, "title is required"),
  imageId: z.guid("invalid GUID format").optional(),
  exercises: z
    .array(ExerciseSchema)
    .min(1, "At least one exercise is required")
    .max(20, "Maximum number of exercises for this workout reached"),
  imageRemoved: z
    .string()
    .transform((val) => val === "true")
    .optional(),
});
