import express from "express";
import apiRouter from "./routers/apiRouter";
import { authMiddleware } from "./middlewares/authMiddleware";
import authRouter from "./routers/authRouter";
import cors from "cors";
import { getEnvOrThrow } from "./shared/helpers";
import { errorHandler } from "./middlewares/errorHandler";
import cookieParser from "cookie-parser";
import "./shared/cron-job";
import passport from "passport";
import "./config/passport";

const app = express();
const port = "3000";
app.use(
  cors({
    origin: getEnvOrThrow("FRONTEND_URL"),
    credentials: true,
  }),
);
app.use(passport.initialize());
app.use(cookieParser());
app.use(express.json());
app.use("/uploads", express.static(getEnvOrThrow("UPLOADS_DIR")));
app.use("/auth", authRouter);
app.use("/api/v1", authMiddleware, apiRouter);
app.use(errorHandler);

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
