import {
  addWorkout,
  deleteWorkout,
  exercises,
  importExercises,
  removeExercises,
  updateWorkout,
  workouts,
} from "@src/controllers/workoutControllers";
import { handleUpload } from "@src/shared/storage";
import { Router } from "express";

const workoutRouter = Router();

workoutRouter.get("/", workouts);
workoutRouter.get("/exercises/:workoutId", exercises);
workoutRouter.post("/add-workout", handleUpload("image"), addWorkout);
workoutRouter.put("/update-workout/:workoutId", handleUpload("image"), updateWorkout);
workoutRouter.delete("/delete-workout/:workoutId", deleteWorkout);
workoutRouter.post("/remove-exercises", removeExercises);
workoutRouter.post("/import-exercises", importExercises);

export default workoutRouter;
