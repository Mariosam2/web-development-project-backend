import {
  addWorkout,
  deleteWorkout,
  exercises,
  importExercises,
  updateWorkout,
  workouts,
} from "@src/controllers/workoutControllers";
import { Router } from "express";

const workoutRouter = Router();

workoutRouter.get("/", workouts);
workoutRouter.get("/exercises/:workoutId", exercises);
workoutRouter.post("/add-workout", addWorkout);
workoutRouter.put("/update-workout/:workoutId", updateWorkout);
workoutRouter.delete("/delete-workout/:workoutId", deleteWorkout);
workoutRouter.post("/import-exercises", importExercises);

export default workoutRouter;
