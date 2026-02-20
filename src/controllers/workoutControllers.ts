import { prisma } from "@src/../lib/prisma";
import { WorkoutSchema } from "@src/shared/schemas/WorkoutSchema";
import { Request, Response } from "express";
import { Exercise } from "generated/prisma/client";

export const workouts = async (req: Request, res: Response) => {
  try {
    const workouts = await prisma.workout.findMany();
    return res.status(200).json({ success: true, data: workouts });
  } catch (error) {
    return res.status(500).json({ succes: false, message: (error as Error).message });
  }
};

export const exercises = async (req: Request, res: Response) => {
  try {
    const { workoutId } = req.params;
    const exercises = await prisma.exercise.findMany({ where: { id: workoutId as string } });

    return res.status(200).json({ success: true, data: exercises });
  } catch (error) {
    return res.status(500).json({ succes: false, message: (error as Error).message });
  }
};

export const addWorkout = async (req: Request, res: Response) => {
  try {
    const result = WorkoutSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ success: false, message: result.error.message });
    }

    const workout = result.data;
    const newWorkout = await prisma.workout.create({ data: workout });

    return res.status(200).json({ success: true, idOut: newWorkout.id, message: "workout created successfully!" });
  } catch (error) {
    return res.status(500).json({ succes: false, message: (error as Error).message });
  }
};

export const updateWorkout = async (req: Request, res: Response) => {
  try {
    const { workoutId } = req.params;
    const result = WorkoutSchema.safeParse(req.body);
    if (!result.success || !workoutId) {
      return res.status(400).json({ success: false, message: result.error?.message ?? "workoutId is required" });
    }

    const workout = result.data;
    const newWorkout = await prisma.workout.update({ where: { id: workoutId as string }, data: workout });

    return res.status(200).json({ success: true, idOut: newWorkout.id, message: "workout updated successfully!" });
  } catch (error) {
    return res.status(500).json({ succes: false, message: (error as Error).message });
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
    return res.status(500).json({ succes: false, message: (error as Error).message });
  }
};

export const importExercises = async (req: Request, res: Response) => {
  try {
    const result = req.body;
    if (!result.success) {
      return res.status(400).json({ success: false, message: result.error.message });
    }

    const { workoutId, exercises } = result.data;
    const newExercises = await Promise.all(exercises.map((e: Exercise) => prisma.exercise.create({ data: e })));

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
    return res.status(500).json({ succes: false, message: (error as Error).message });
  }
};
