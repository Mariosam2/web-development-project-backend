import { LoginSchema } from "@src/shared/schemas/LoginSchema";
import { UserSchema } from "@src/shared/schemas/UserSchema";
import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { prisma } from "@src/../lib/prisma";
import bcrypt from "bcrypt";
import { generateTokensAndCookie, getEnvOrThrow, messageFromPrismaError } from "@src/shared/helpers";
import { RegisterSchema } from "@src/shared/schemas/RegisterSchema";
import { ITokenPayload } from "@src/shared/interfaces/ITokenPayload";
import { PrismaClientValidationError } from "@prisma/client/runtime/client";
import { PrismaClientKnownRequestError } from "generated/prisma/internal/prismaNamespace";

export const login = async (req: Request, res: Response) => {
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
    if (error instanceof PrismaClientValidationError) {
      return res.status(400).json({
        success: false,
        message: "invalid data provided",
      });
    }

    if (error instanceof PrismaClientKnownRequestError) {
      const errorMessage = messageFromPrismaError(error.code, "user");
      return res.status(500).json({
        success: false,
        message: errorMessage,
      });
    }

    return res.status(500).json({
      success: false,
      message: (error as Error).message,
    });
  }
};

export const register = async (req: Request, res: Response) => {
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
    const newUser = await prisma.user.create({ data: { ...user, password: hashedPassword } });
    const accessToken = generateTokensAndCookie(newUser, res);

    return res.status(200).json({ success: true, accessToken });
  } catch (error) {
    console.log(error);
    if (error instanceof PrismaClientValidationError) {
      return res.status(400).json({
        success: false,
        message: "invalid data provided",
      });
    }

    if (error instanceof PrismaClientKnownRequestError) {
      const errorMessage = messageFromPrismaError(error.code, "user");
      return res.status(500).json({
        success: false,
        message: errorMessage,
      });
    }

    return res.status(500).json({
      success: false,
      message: (error as Error).message,
    });
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
    if (error instanceof PrismaClientValidationError) {
      return res.status(400).json({
        success: false,
        message: "invalid data provided",
      });
    }

    if (error instanceof PrismaClientKnownRequestError) {
      const errorMessage = messageFromPrismaError(error.code, "user");
      return res.status(500).json({
        success: false,
        message: errorMessage,
      });
    }

    return res.status(500).json({
      success: false,
      message: (error as Error).message,
    });
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
