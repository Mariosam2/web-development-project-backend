import {
  singleExercise,
  exercises,
  bodyParts,
  targetMuscles,
  exerciseTypes,
  equipments,
} from "@src/controllers/exerciseControllers";
import { Router } from "express";

const exerciseRouter = Router();

exerciseRouter.get("/", exercises);
exerciseRouter.get("/body-parts", bodyParts);
exerciseRouter.get("/target-muscles", targetMuscles);
exerciseRouter.get("/types", exerciseTypes);
exerciseRouter.get("/equipments", equipments);
exerciseRouter.get("/:exerciseId", singleExercise);

export default exerciseRouter;
