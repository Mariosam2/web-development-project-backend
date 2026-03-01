import { prisma } from "@src/../lib/prisma";
import { saveExercisesAndOrderRelations } from "@src/shared/helpers";
import { ImportExercisesSchema } from "@src/shared/schemas/ImportExercisesSchema";
import { WorkoutSchema } from "@src/shared/schemas/WorkoutSchema";
import { NextFunction, Request, Response } from "express";

export const workouts = async (req: Request, res: Response) => {
  const { userId } = req.user as Express.User;

  const workouts = await prisma.workout.findMany({
    where: { userId },
    omit: { userId: true },
    include: {
      exerciseWorkouts: {
        include: {
          exercise: true,
        },
      },
    },
  });

  const workoutWithExercises = workouts.map((w) => {
    const { exerciseWorkouts, ...workout } = w;
    return {
      ...workout,
      exercises: exerciseWorkouts.map(({ exercise, sets, reps }) => ({
        ...exercise,
        sets,
        reps,
      })),
    };
  });

  return res.status(200).json({ success: true, data: workoutWithExercises });
};

export const exercises = async (req: Request, res: Response) => {
  const { workoutId } = req.params;
  const exercises = await prisma.exercise.findMany({
    where: { id: workoutId as string },
  });

  return res.status(200).json({ success: true, data: exercises });
};

export const addWorkout = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = WorkoutSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        success: false,
        validationErrors: result.error.issues.map((e) => ({
          field: e.path.join("."),
          message: e.message,
        })),
      });
    }

    const { userId } = req.user as Express.User;
    const { exercises, ...workout } = result.data;

    const newWorkout = await prisma.workout.create({
      data: {
        ...workout,
        userId,
      },
    });
    await saveExercisesAndOrderRelations(exercises, newWorkout.id);

    return res.status(200).json({ success: true, idOut: newWorkout.id, message: "Workout created successfully!" });
  } catch (error) {
    next(error);
  }
};

export const updateWorkout = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { workoutId } = req.params;
    const result = WorkoutSchema.safeParse(req.body);
    if (!result.success || !workoutId) {
      return res.status(400).json({
        success: false,
        validationErrors:
          result.error?.issues.map((e) => ({
            field: e.path.join("."),
            message: e.message,
          })) ?? "WorkoutId is required",
      });
    }

    const workout = result.data;
    const newWorkout = await prisma.workout.update({ where: { id: workoutId as string }, data: workout });

    await saveExercisesAndOrderRelations(workout.exercises, newWorkout.id);

    return res.status(200).json({ success: true, idOut: newWorkout.id, message: "Workout updated successfully!" });
  } catch (error) {
    next(error);
  }
};

export const deleteWorkout = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { workoutId } = req.params;
    if (!workoutId) {
      return res.status(400).json({ success: false, message: "WorkoutId is required" });
    }

    await prisma.exerciseWorkout.deleteMany({ where: { workoutId: workoutId as string } });

    const deletedWorkout = await prisma.workout.delete({ where: { id: workoutId as string } });
    if (!deletedWorkout) {
      return res.status(404).json({ success: false, message: "Workout not found" });
    }

    return res.status(200).json({ success: true, idOut: deletedWorkout.id, message: "Workout updated successfully!" });
  } catch (error) {
    next(error);
  }
};

export const importExercises = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = ImportExercisesSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        success: false,
        validationErrors: result.error.issues.map((e) => ({
          field: e.path.join("."),
          message: e.message,
        })),
      });
    }

    const { workoutId, exercises } = result.data;
    const newExercises = await saveExercisesAndOrderRelations(exercises, workoutId);

    return res
      .status(200)
      .json({ success: true, idOut: newExercises[0].id, message: "exercises imported successfully!" });
  } catch (error) {
    next(error);
  }
};
