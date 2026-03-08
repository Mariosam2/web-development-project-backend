import {
  checkAuth,
  forgotPassword,
  googleAuthCallback,
  login,
  logout,
  refreshToken,
  register,
  resetPassword,
} from "@src/controllers/authControllers";
import { authMiddleware } from "@src/middlewares/authMiddleware";
import { Router } from "express";
import passport from "passport";

const authRouter = Router();
authRouter.get("/google", passport.authenticate("google", { scope: ["profile", "email"] }));
authRouter.get(
  "/google/callback",
  passport.authenticate("google", { session: false, failureRedirect: "/login" }),
  googleAuthCallback,
);
authRouter.post("/login", login);
authRouter.post("/register", register);
authRouter.post("/register", register);
authRouter.post("/refresh-token", refreshToken);
authRouter.post("/logout", authMiddleware, logout);
authRouter.get("/check-auth", authMiddleware, checkAuth);
authRouter.post("/forgot-password", forgotPassword);
authRouter.patch("/reset-password", resetPassword);

export default authRouter;
