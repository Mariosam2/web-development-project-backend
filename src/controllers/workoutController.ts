import { prisma } from "@src/../lib/prisma";
import { Request, Response } from "express";

export const workouts = async (req: Request, res: Response) => {
  try {
    const workouts = await prisma.workout.findMany();
    return res.status(200).json({ success: true, data: workouts });
  } catch (error) {
    return res
      .status(500)
      .json({ succes: false, message: (error as Error).message });
  }
};

export const addWorkout = async (req: Request, res: Response) => {
  try {
    const workout = req.body;

    if (!workout.title) {
      return res
        .status(400)
        .json({ success: false, message: "Title is required" });
    }

    const workouts = await prisma.workout.create({ data: workout });

    return res.status(200).json({ success: true, data: workouts });
  } catch (error) {
    return res
      .status(500)
      .json({ succes: false, message: (error as Error).message });
  }
};

export const updateWorkout = async () => {};

export const deleteWorkout = async () => {};

export const importExercise = async () => {};
