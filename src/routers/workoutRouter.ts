import {
  addWorkout,
  completeWorkout,
  deleteWorkout,
  exercises,
  importExercises,
  removeExercises,
  singleWorkout,
  updateWorkout,
  workouts,
} from "@src/controllers/workoutControllers";
import { handleUpload } from "@src/shared/storage";
import { Router } from "express";

const workoutRouter = Router();

workoutRouter.get("/", workouts);
workoutRouter.post("/add-workout", handleUpload("image"), addWorkout);
workoutRouter.post("/remove-exercises", removeExercises);
workoutRouter.post("/import-exercises", importExercises);
workoutRouter.patch("/complete-workout/:workoutId", completeWorkout);
workoutRouter.put("/update-workout/:workoutId", handleUpload("image"), updateWorkout);
workoutRouter.delete("/delete-workout/:workoutId", deleteWorkout);
workoutRouter.get("/exercises/:workoutId", exercises);
workoutRouter.get("/:workoutId", singleWorkout);

export default workoutRouter;
