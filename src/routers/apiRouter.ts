import { Router } from "express";
import exerciseRouter from "./exerciseRouter";
import workoutRouter from "./workoutRouter";
import activityRouter from "./activityRouter";

const apiRouter = Router();

apiRouter.use("/exercises", exerciseRouter);
apiRouter.use("/workouts", workoutRouter);
apiRouter.use("/activity", activityRouter);

export default apiRouter;
