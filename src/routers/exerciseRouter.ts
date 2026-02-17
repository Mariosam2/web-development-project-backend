import { exercise, exercises } from "@src/controllers/exerciseController";
import { Router } from "express";

const exerciseRouter = Router();

exerciseRouter.get("/", exercises);
exerciseRouter.get("/:exerciseId", exercise);

export default exerciseRouter;
