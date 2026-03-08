import { Router } from "express";
import exerciseRouter from "./exerciseRouter";
import workoutRouter from "./workoutRouter";
import activityRouter from "./activityRouter";
import profileRouter from "./profileRouter";

const apiRouter = Router();

apiRouter.use("/exercises", exerciseRouter);
apiRouter.use("/workouts", workoutRouter);
apiRouter.use("/activity", activityRouter);
apiRouter.use("/profile", profileRouter);

export default apiRouter;
