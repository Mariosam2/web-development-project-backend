import { LoginSchema } from "@src/shared/schemas/LoginSchema";
import { UserSchema } from "@src/shared/schemas/UserSchema";
import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { prisma } from "@src/../lib/prisma";
import bcrypt from "bcrypt";
import { generateTokensAndCookie, getEnvOrThrow, passwordResetTemplate } from "@src/shared/helpers";
import { RegisterSchema } from "@src/shared/schemas/RegisterSchema";
import { ITokenPayload } from "@src/shared/interfaces/ITokenPayload";
import { transporter } from "@src/shared/transporter";

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = LoginSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.error.issues[0].message,
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
        message: result.error.issues[0].message,
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
    const { id } = req.user as Express.User;
    await prisma.user.update({
      where: { id },
      data: { tokenVersion: { increment: 1 } },
    });

    res.clearCookie("refreshToken").status(200).json({ success: true });
  } catch (error) {
    next(error);
  }
};

export const googleAuthCallback = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = UserSchema.safeParse(req.user);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.error.issues[0].message,
      });
    }
    const authUser = await prisma.user.findUniqueOrThrow({ where: { googleId: result.data.googleId } });
    const accessToken = generateTokensAndCookie(authUser, res);
    res.redirect(`${getEnvOrThrow("FRONTEND_URL")}/auth/callback?token=${accessToken}`);
  } catch (error) {
    next(error);
  }
};

export const forgotPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    const resetPasswordToken = jwt.sign({ id: user.id }, getEnvOrThrow("RESET_PASSWORD_TOKEN_SECRET"), {
      expiresIn: "15min",
    });

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetPasswordToken}`;
    await transporter.sendMail({
      from: '"ManMot" <noreply.manmot@gmail.com>',
      to: user.email,
      subject: "Reset your ManMot password",
      html: passwordResetTemplate(resetUrl),
    });

    await prisma.user.update({
      data: { resetPasswordToken },
      where: { id: user.id },
    });

    return res.status(200).json({ success: true, message: "Email sent successfully" });
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token, password } = req.body;
    const decoded = jwt.verify(token, getEnvOrThrow("RESET_PASSWORD_TOKEN_SECRET")) as ITokenPayload;
    if (!decoded) return res.status(401).json({ success: false, message: "Unauthorized" });

    const hashedPassword = await bcrypt.hash(password, 10);
    await prisma.user.update({
      data: { password: hashedPassword, resetPasswordToken: null },
      where: { id: decoded.id },
    });

    return res.json({ success: true, message: "Password reset successfully" });
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ success: false, message: "Reset link expired" });
    }
    next(error);
  }
};
