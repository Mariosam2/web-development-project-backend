import { NextFunction, Request, Response } from "express";
import { prisma } from "@src/../lib/prisma";
export const completedWorkouts = async (req: Request, res: Response, next: NextFunction) => {
  const { id: userId } = req.user as Express.User;
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
  const { id: userId } = req.user as Express.User;
  const { today: todayRaw } = req.query;
  const today = todayRaw ? new Date(todayRaw as string) : new Date();
  today.setHours(23, 59, 59, 999);
  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(today.getDate() - 6);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  const recentCompleted = await prisma.completedWorkout.findMany({
    where: {
      userId,
      completedAt: {
        gte: sevenDaysAgo,
        lte: today,
      },
    },
    include: { workout: { select: { estimatedDuration: true } } },
  });

  const totalWorkoutsDuration = recentCompleted.reduce((acc, curr) => acc + (curr.workout?.estimatedDuration ?? 0), 0);

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

  today.setHours(0, 0, 0, 0);
  const streakDate = new Date(today);
  let streak = 0;
  while (dateTimesWithCompletedWorkout.includes(streakDate.getTime())) {
    streak++;
    streakDate.setDate(streakDate.getDate() - 1);
  }

  const statistics = {
    workoutsCount: recentCompleted.length,
    totalWorkoutsDuration,
    streak,
  };

  return res.status(200).json({ success: true, data: statistics });
};
