import { completedWorkouts, statistics } from "@src/controllers/activityController";
import { Router } from "express";

const activityRouter = Router();

activityRouter.get("/completed-workouts", completedWorkouts);
activityRouter.get("/statistics", statistics);

export default activityRouter;
