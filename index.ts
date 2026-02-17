import express from "express";
import apiRouter from "./src/routers/apiRouter";
const app = express();
const port = "3000";

app.use("/api/v1", apiRouter);

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
