import { googleAuthCallbak, login, refreshToken, register } from "@src/controllers/authControllers";
import { Router } from "express";
import passport from "passport";

const authRouter = Router();

authRouter.get("/oogle/callback", passport.authenticate("google", { session: false }), googleAuthCallbak);
authRouter.post("/login", login);
authRouter.post("/register", register);
authRouter.post("/refresh-token", refreshToken);

export default authRouter;
