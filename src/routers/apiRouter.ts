import { Router } from "express";
import exerciseRouter from "./exerciseRouter";
import workoutRouter from "./workoutRouter";

const apiRouter = Router();

apiRouter.use("/exercises", exerciseRouter);
apiRouter.use("/workouts", workoutRouter);

export default apiRouter;
