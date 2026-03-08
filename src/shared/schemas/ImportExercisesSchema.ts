import * as z from "zod";
import { ExerciseSchema } from "./ExerciseSchema";

export const ImportExercisesSchema = z.object({
  workoutId: z.guid("invalid GUID format"),
  exercises: z
    .array(ExerciseSchema)
    .min(1, "At least one exercise is required")
    .max(20, "Maximum number of exercises for this workout reached"),
});
