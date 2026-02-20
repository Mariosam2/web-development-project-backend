import { singleExercise, exercisesFromExerciseDb } from "@src/controllers/exerciseControllers";
import { Router } from "express";

const exerciseRouter = Router();

exerciseRouter.get("/", exercisesFromExerciseDb);
exerciseRouter.get("/:exerciseId", singleExercise);

export default exerciseRouter;
