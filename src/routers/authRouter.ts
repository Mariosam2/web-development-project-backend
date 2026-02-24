import {
  checkAuth,
  googleAuthCallbak,
  login,
  logout,
  refreshToken,
  register,
} from "@src/controllers/authControllers";
import { authMiddleware } from "@src/middlewares/authMiddleware";
import { Router } from "express";
import passport from "passport";

const authRouter = Router();

authRouter.get(
  "/google/callback",
  passport.authenticate("google", { session: false }),
  googleAuthCallbak,
);
authRouter.post("/login", login);
authRouter.post("/register", register);
authRouter.post("/register", register);
authRouter.post("/refresh-token", refreshToken);
authRouter.post("/logout", authMiddleware, logout);
authRouter.get("/check-auth", authMiddleware, checkAuth);

export default authRouter;
