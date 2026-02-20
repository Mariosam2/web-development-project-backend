import { googleAuthCallbak, login, register } from "@src/controllers/authControllers";
import { Router } from "express";
import passport from "passport";

const authRouter = Router();

authRouter.get("/oogle/callback", passport.authenticate("google", { session: false }), googleAuthCallbak);
authRouter.post("/login", login);
authRouter.post("/register", register);

export default authRouter;
