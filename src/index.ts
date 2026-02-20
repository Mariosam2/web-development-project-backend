import express from "express";
import apiRouter from "./routers/apiRouter";
import { authMiddleware } from "./middlewares/authMiddleware";
import authRouter from "./routers/authRouter";
const app = express();
const port = "3000";
app.use(express.json());
app.use("/auth", authRouter);
app.use("/api/v1", authMiddleware, apiRouter);

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
