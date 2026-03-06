import * as z from "zod";

export const RemoveExercisesSchema = z.object({
  workoutId: z.guid("invalid GUID format"),
  exercisesIds: z.array(z.guid("invalid GUID format")),
  updatedDuration: z.number().positive().optional(),
});
