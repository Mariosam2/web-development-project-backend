import { LoginSchema } from "@src/shared/schemas/LoginSchema";
import { UserSchema } from "@src/shared/schemas/UserSchema";
import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { prisma } from "@src/../lib/prisma";
import bcrypt from "bcrypt";
import { generateTokensAndCookie, getEnvOrThrow } from "@src/shared/helpers";
import { RegisterSchema } from "@src/shared/schemas/RegisterSchema";
import { ITokenPayload } from "@src/shared/interfaces/ITokenPayload";

export const login = async (req: Request, res: Response) => {
  try {
    const result = LoginSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ success: false, message: result.error.message });
    }

    const { username, email, password } = result.data;

    const authUser = await prisma.user.findFirst({ where: { OR: [{ username }, { email }] } });
    if (!authUser) {
      return res.status(404).json({ success: false, message: "user not found" });
    }

    const isPasswordCorrect = await bcrypt.compare(password, authUser.password ?? "");
    if (!isPasswordCorrect) {
      return res.status(401).json({ success: false, message: "unaurthorized" });
    }

    const accessToken = generateTokensAndCookie(authUser, res);

    return res.status(200).json({ success: true, accessToken });
  } catch (error) {
    return res.status(500).json({ succes: false, message: (error as Error).message });
  }
};

export const register = async (req: Request, res: Response) => {
  try {
    const result = RegisterSchema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({ success: false, message: result.error.message });
    }

    const user = result.data;
    const newUser = await prisma.user.create({ data: user });
    const accessToken = generateTokensAndCookie(newUser, res);

    return res.status(200).json({ success: true, accessToken });
  } catch (error) {
    return res.status(500).json({ succes: false, message: (error as Error).message });
  }
};

export const refreshToken = async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.cookies;
    if (!refreshToken) {
      return res.status(401).json({ success: false, message: "unauthorized" });
    }

    const decoded = jwt.verify(refreshToken, getEnvOrThrow("JWT_REFRESH_SECRET")) as ITokenPayload;
    if (!decoded) {
      return res.status(401).json({ success: false, message: "unauthorized" });
    }

    const authUser = await prisma.user.findFirst({ where: { id: decoded.id } });
    if (!authUser) {
      return res.status(401).json({ success: false, message: "unauthorized" });
    }

    const accessToken = generateTokensAndCookie(authUser, res);

    return res.status(200).json({ success: true, accessToken });
  } catch (error) {
    return res.status(500).json({ succes: false, message: (error as Error).message });
  }
};

export const googleAuthCallbak = (req: Request, res: Response) => {
  const result = UserSchema.safeParse(req.user);
  if (!result.success) {
    return res.status(400).json({ success: false, message: result.error.message });
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
