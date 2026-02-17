import { prisma } from "@src/../lib/prisma";
import { Request, Response } from "express";

export const workouts = async (req: Request, res: Response) => {
  try {
    const workouts = await prisma.workout.findMany();
    return res.status(200).json({ success: true, data: workouts });
  } catch (error) {
    return res.status(500).json({ succes: false, message: (error as Error).message });
  }
};
