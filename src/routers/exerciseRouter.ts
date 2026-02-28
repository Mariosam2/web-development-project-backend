import {
  singleExercise,
  exercises,
  bodyParts,
  targetMuscles,
  exerciseTypes,
} from "@src/controllers/exerciseControllers";
import { Router } from "express";

const exerciseRouter = Router();

exerciseRouter.get("/", exercises);
exerciseRouter.get("/body-parts", bodyParts);
exerciseRouter.get("/target-muscles", targetMuscles);
exerciseRouter.get("/types", exerciseTypes);
exerciseRouter.get("/:exerciseId", singleExercise);

export default exerciseRouter;
