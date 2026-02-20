import { exercises, workouts } from "@src/controllers/workoutControllers";
import { Router } from "express";

const workoutRouter = Router();

workoutRouter.get("/", workouts);
workoutRouter.get("/exercises/:workoutId", exercises);

export default workoutRouter;
