import cron from "node-cron";
import { prisma } from "@src/../lib/prisma";
const resetWorkouts = async () => {
  try {
    await prisma.workout.updateMany({
      where: {
        completed: true,
      },
      data: {
        completed: false,
        completedAt: null,
      },
    });
    console.log("Workouts reset");
  } catch (err) {
    console.log(err);
  }
};

cron.schedule("0 0 * * *", resetWorkouts);
