import * as z from "zod";
import { ExerciseSchema } from "./ExerciseSchema";

export const ImportExercisesSchema = z.object({
  workoutId: z.guid("invalid GUID format"),
  exercises: z.array(ExerciseSchema),
});
