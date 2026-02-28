import { LoginSchema } from "@src/shared/schemas/LoginSchema";
import { UserSchema } from "@src/shared/schemas/UserSchema";
import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { prisma } from "@src/../lib/prisma";
import bcrypt from "bcrypt";
import { generateTokensAndCookie, getEnvOrThrow } from "@src/shared/helpers";
import { RegisterSchema } from "@src/shared/schemas/RegisterSchema";
import { ITokenPayload } from "@src/shared/interfaces/ITokenPayload";

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = LoginSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        success: false,
        validationErrors: result.error.issues.map((e) => ({
          field: e.path.join("."),
          message: e.message,
        })),
      });
    }

    const { username, email, password } = result.data;

    const authUser = await prisma.user.findFirstOrThrow({
      where: { OR: [{ username }, { email }] },
    });
    const isPasswordCorrect = await bcrypt.compare(password, authUser.password ?? "");
    if (!isPasswordCorrect) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const accessToken = generateTokensAndCookie(authUser, res);

    return res.status(200).json({ success: true, accessToken });
  } catch (error) {
    next(error);
  }
};

export const checkAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refreshToken } = req.cookies;
    if (!refreshToken) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const decoded = jwt.verify(refreshToken, getEnvOrThrow("JWT_REFRESH_SECRET")) as ITokenPayload;
    if (!decoded) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const authUser = await prisma.user.findFirst({ where: { id: decoded.id } });
    if (!authUser || authUser.tokenVersion !== decoded.tokenVersion) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    return res.status(200).json({ success: true, message: "Authorized" });
  } catch (error) {
    next(error);
  }
};

export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = RegisterSchema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        validationErrors: result.error.issues.map((e) => ({
          field: e.path.join("."),
          message: e.message,
        })),
      });
    }

    const { confirmPassword, ...user } = result.data;
    const hashedPassword = await bcrypt.hash(user.password, 10);
    const newUser = await prisma.user.create({
      data: { ...user, password: hashedPassword },
    });
    const accessToken = generateTokensAndCookie(newUser, res);

    return res.status(200).json({ success: true, accessToken });
  } catch (error) {
    console.log(error);
    next(error);
  }
};

export const refreshToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refreshToken } = req.cookies;
    if (!refreshToken) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const decoded = jwt.verify(refreshToken, getEnvOrThrow("JWT_REFRESH_SECRET")) as ITokenPayload;
    if (!decoded) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const authUser = await prisma.user.findFirst({ where: { id: decoded.id } });
    if (!authUser || authUser.tokenVersion !== decoded.tokenVersion) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const accessToken = generateTokensAndCookie(authUser, res);

    return res.status(200).json({ success: true, accessToken });
  } catch (error) {
    res.clearCookie("refreshToken");
    next(error);
  }
};

export const logout = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.user as Express.User;
    await prisma.user.update({
      where: { id: userId },
      data: { tokenVersion: { increment: 1 } },
    });

    res.clearCookie("refreshToken").status(200).json({ success: true });
  } catch (error) {
    next(error);
  }
};

export const googleAuthCallbak = (req: Request, res: Response) => {
  const result = UserSchema.safeParse(req.user);
  if (!result.success) {
    return res.status(400).json({
      success: false,
      validationErrors: result.error.issues.map((e) => ({
        field: e.path.join("."),
        message: e.message,
      })),
    });
  }

  const user = result.data;
  const accessToken = jwt.sign({ id: user.id, email: user.email }, getEnvOrThrow("JWT_SECRET"), { expiresIn: "15m" });
  const refreshToken = jwt.sign({ id: user.id, tokenVersion: user.tokenVersion }, getEnvOrThrow("JWT_REFRESH_SECRET"), {
    expiresIn: "7d",
  });

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  res.redirect(`${process.env.FRONTEND_URL}/auth/callback?access=${accessToken}`);
};
