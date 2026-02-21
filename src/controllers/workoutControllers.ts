import { PrismaClientValidationError } from "@prisma/client/runtime/client";
import { prisma } from "@src/../lib/prisma";
import { messageFromPrismaError } from "@src/shared/helpers";
import { ImportExercisesSchema } from "@src/shared/schemas/ImportExercisesSchema";
import { WorkoutSchema } from "@src/shared/schemas/WorkoutSchema";
import { Request, Response } from "express";
import { Exercise } from "generated/prisma/client";
import { PrismaClientKnownRequestError } from "generated/prisma/internal/prismaNamespace";

export const workouts = async (req: Request, res: Response) => {
  try {
    if (!req.user) return res.status(403).json({ success: false, message: "user is not logged in" });
    const { userId } = req.user;
    const workouts = await prisma.workout.findMany({ where: { userId } });

    return res.status(200).json({ success: true, data: workouts });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: (error as Error).message,
    });
  }
};

export const exercises = async (req: Request, res: Response) => {
  try {
    const { workoutId } = req.params;
    const exercises = await prisma.exercise.findMany({ where: { id: workoutId as string } });

    return res.status(200).json({ success: true, data: exercises });
  } catch (error) {
    if (error instanceof PrismaClientValidationError) {
      return res.status(400).json({
        success: false,
        message: "invalid data provided",
      });
    }

    if (error instanceof PrismaClientKnownRequestError) {
      const errorMessage = messageFromPrismaError(error.code, "workout");
      return res.status(500).json({
        success: false,
        message: errorMessage,
      });
    }

    return res.status(500).json({
      success: false,
      message: (error as Error).message,
    });
  }
};

export const addWorkout = async (req: Request, res: Response) => {
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

    if (!req.user) return res.status(403).json({ success: false, message: "user is not logged in" });

    const { userId } = req.user;
    const workout = { ...result.data, userId };
    const newWorkout = await prisma.workout.create({ data: workout });

    return res.status(200).json({ success: true, idOut: newWorkout.id, message: "workout created successfully!" });
  } catch (error) {
    if (error instanceof PrismaClientValidationError) {
      return res.status(400).json({
        success: false,
        message: "invalid data provided",
      });
    }

    if (error instanceof PrismaClientKnownRequestError) {
      const errorMessage = messageFromPrismaError(error.code, "workout");
      return res.status(500).json({
        success: false,
        message: errorMessage,
      });
    }

    return res.status(500).json({
      success: false,
      message: (error as Error).message,
    });
  }
};

export const updateWorkout = async (req: Request, res: Response) => {
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
          })) ?? "workoutId is required",
      });
    }

    const workout = result.data;
    const newWorkout = await prisma.workout.update({ where: { id: workoutId as string }, data: workout });

    return res.status(200).json({ success: true, idOut: newWorkout.id, message: "workout updated successfully!" });
  } catch (error) {
    if (error instanceof PrismaClientValidationError) {
      return res.status(400).json({
        success: false,
        message: "invalid data provided",
      });
    }

    if (error instanceof PrismaClientKnownRequestError) {
      const errorMessage = messageFromPrismaError(error.code, "workout");
      return res.status(500).json({
        success: false,
        message: errorMessage,
      });
    }

    return res.status(500).json({
      success: false,
      message: (error as Error).message,
    });
  }
};

export const deleteWorkout = async (req: Request, res: Response) => {
  try {
    const { workoutId } = req.params;
    if (!workoutId) {
      return res.status(400).json({ success: false, message: "workoutId is required" });
    }

    const newWorkout = await prisma.workout.delete({ where: { id: workoutId as string } });
    if (!newWorkout) {
      return res.status(404).json({ success: false, message: "workout not found" });
    }

    return res.status(200).json({ success: true, idOut: newWorkout.id, message: "workout updated successfully!" });
  } catch (error) {
    if (error instanceof PrismaClientValidationError) {
      return res.status(400).json({
        success: false,
        message: "invalid data provided",
      });
    }

    if (error instanceof PrismaClientKnownRequestError) {
      const errorMessage = messageFromPrismaError(error.code, "workout");
      return res.status(500).json({
        success: false,
        message: errorMessage,
      });
    }

    return res.status(500).json({
      success: false,
      message: (error as Error).message,
    });
  }
};

export const importExercises = async (req: Request, res: Response) => {
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
    const newExercises = await Promise.all(
      exercises.map((e) => {
        const { id, ...data } = e;
        return prisma.exercise.create({ data: data });
      }),
    );

    const existingCount = await prisma.exerciseWorkout.count({
      where: { workoutId },
    });

    await prisma.exerciseWorkout.createMany({
      data: newExercises.map((e: Exercise, index) => ({
        workoutId,
        exerciseId: e.id,
        exerciseOrder: existingCount + (index + 1),
      })),
    });

    return res
      .status(200)
      .json({ success: true, idOut: newExercises[0].id, message: "exercises imported successfully!" });
  } catch (error) {
    if (error instanceof PrismaClientValidationError) {
      return res.status(400).json({
        success: false,
        message: "invalid data provided",
      });
    }

    if (error instanceof PrismaClientKnownRequestError) {
      const errorMessage = messageFromPrismaError(error.code, "workout");
      return res.status(500).json({
        success: false,
        message: errorMessage,
      });
    }

    return res.status(500).json({
      success: false,
      message: (error as Error).message,
    });
  }
};
