import { NextFunction, Request, Response } from "express";
import { prisma } from "@src/../lib/prisma";
export const completedWorkouts = async (req: Request, res: Response, next: NextFunction) => {
  const { userId } = req.user as Express.User;
  const completedWorkouts = await prisma.completedWorkout.groupBy({
    by: ["completedAt"],
    where: { userId },
    _count: { workoutId: true },
    orderBy: { completedAt: "desc" },
  });

  const data = completedWorkouts.map((g) => ({
    date: g.completedAt.toISOString().split("T")[0],
    count: g._count.workoutId,
  }));

  return res.status(200).json({ success: true, data });
};
export const statistics = async (req: Request, res: Response, next: NextFunction) => {
  const { userId } = req.user as Express.User;

  const workouts = await prisma.workout.findMany({ where: { userId } });
  const totalWorkoutsDuration = workouts.reduce((acc, curr) => acc + (curr.estimatedDuration ?? 0), 0);

  const daysWithCompletedWorkout = await prisma.completedWorkout.findMany({
    where: { userId },
    orderBy: { completedAt: "desc" },
    select: { completedAt: true },
  });

  const dateTimesWithCompletedWorkout = daysWithCompletedWorkout.map((cw) => {
    const d = new Date(cw.completedAt);
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  });

  const today = new Date();
  const streakDate = new Date(today);
  let streak = 0;
  while (dateTimesWithCompletedWorkout.includes(streakDate.getTime())) {
    streak++;
    streakDate.setDate(streakDate.getDate() - 1);
  }

  const statistics = {
    workoutsCount: workouts.length,
    totalWorkoutsDuration,
    streak,
  };

  return res.status(200).json({ success: true, data: statistics });
};
