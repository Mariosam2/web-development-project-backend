import { Response } from "express";
import { IApiResponse } from "./interfaces/IApiResponse";
import { User } from "generated/prisma/client";
import jwt from "jsonwebtoken";
export const fetchTyped = async <T>(url: string, method: string = "GET"): Promise<IApiResponse<T> | string> => {
  try {
    const response = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        "X-RapidAPI-Key": getEnvOrThrow("RAPID_API_KEY"),
      },
    });

    return response.json() as Promise<IApiResponse<T>>;
  } catch (error) {
    return (error as Error).message;
  }
};

export const getEnvOrThrow = (variableName: string): string => {
  const envVariable = process.env[variableName];
  if (!envVariable) {
    throw new Error(`${variableName} is not defined`);
  }
  return envVariable;
};

export const generateTokensAndCookie = (user: User, res: Response) => {
  const accessToken = jwt.sign(
    { userId: user.id, username: user.username, email: user.email },
    getEnvOrThrow("JWT_SECRET"),
    {
      expiresIn: "15m",
    },
  );
  const refreshToken = jwt.sign({ id: user.id, tokenVersion: user.tokenVersion }, getEnvOrThrow("JWT_REFRESH_SECRET"), {
    expiresIn: "7d",
  });

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
  return accessToken;
};

export const messageFromPrismaError = (errorCode: string, model: string) => {
  switch (errorCode) {
    case "P2002": // unique constraint
      return `${model} already exists`;

    case "P2025": // record not found (update/delete)
      return `${model} not found`;

    case "P2003": // foreign key constraint
      return "related record not found";

    case "P2014": // relation violation
      return "relation constraint violated";

    default:
      return "unknown error";
  }
};
