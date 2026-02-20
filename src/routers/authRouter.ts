import { googleAuthCallbak } from "@src/controllers/authControllers";
import { Router } from "express";
import passport from "passport";

const authRouter = Router();

authRouter.get("/auth/google/callback", passport.authenticate("google", { session: false }), googleAuthCallbak);

export default authRouter;
