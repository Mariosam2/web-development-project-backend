import { Request, Response } from "express";
import { IApiResponse } from "./interfaces/IApiResponse";
import { Exercise, User } from "@src/../generated/prisma/client";
import jwt from "jsonwebtoken";
import { prisma } from "@src/../lib/prisma";
import { ExerciseSchema } from "./schemas/ExerciseSchema";
import * as z from "zod";
export const fetchTyped = async <T>(url: string, method: string = "GET"): Promise<IApiResponse<T> | string> => {
  const res = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      "X-RapidAPI-Key": getEnvOrThrow("RAPID_API_KEY"),
    },
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${res.statusText}`);
  }
  return res.json();
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

export const saveExercisesAndOrderRelations = async (
  exercises: z.infer<typeof ExerciseSchema>[],
  workoutId: string,
) => {
  const newExercises = await Promise.all(
    exercises.map((e) => {
      const { exerciseId, reps, sets, ...data } = e;
      return prisma.exercise.upsert({
        where: { exerciseId },
        create: { exerciseId, ...data },
        update: {},
      });
    }),
  );

  await prisma.exerciseWorkout.deleteMany({ where: { workoutId } });
  //console.log(exercises);
  await prisma.exerciseWorkout.createMany({
    data: newExercises.map((e: Exercise, index) => ({
      workoutId,
      exerciseId: e.id,
      exerciseOrder: index + 1,
      reps: exercises[index].reps,
      sets: exercises[index].sets,
    })),
  });

  return newExercises;
};

export const createQueryParams = (req: Request) => {
  const queryParams = new URLSearchParams();
  Object.entries(req.query).forEach(([key, value]) => {
    if (value !== undefined && value !== "") {
      queryParams.append(key, String(value));
    }
  });
  return queryParams;
};
const logoUrl = "https://res.cloudinary.com/dy6mvmmiy/image/upload/v1772933246/logo-icon_jj2ltv.png";

export const passwordResetTemplate = (resetUrl: string) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Reset your password</title>
</head>
<body style="margin:0;padding:0;background-color:#f6f6f6;font-family:'Poppins',system-ui,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f6f6f6;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="520" cellpadding="0" cellspacing="0" style="background-color:#1e1e1e;border-radius:24px;overflow:hidden;">

          <!-- Logo -->
          <tr>
            <td align="center" style="padding:40px 40px 8px;">
              <div style="background-color:#f3ff96;border-radius:16px;padding:12px;display:inline-block;">
                <img src="${logoUrl}" width="60" height="60" alt="ManMot" style="display:block;" />
              </div>
            </td>
          </tr>

          <!-- Brand name -->
          <tr>
            <td align="center" style="padding:0 40px 32px;">
              <span style="font-size:20px;font-weight:700;color:#f3ff96;letter-spacing:2px;">MANMOT</span>
            </td>
          </tr>

          <!-- Title -->
          <tr>
            <td align="center" style="padding:0 40px 12px;">
              <h1 style="margin:0;font-size:28px;font-weight:700;color:#ffffff;line-height:1.3;">
                Reset your password
              </h1>
            </td>
          </tr>

          <!-- Subtitle -->
          <tr>
            <td align="center" style="padding:0 48px 36px;">
              <p style="margin:0;font-size:14px;color:#b2b2b2;line-height:1.7;text-align:center;">
                We received a request to reset your ManMot password.<br/>
                Click the button below to choose a new one.
              </p>
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding:0 40px;">
              <div style="height:1px;background-color:#2e2e2e;"></div>
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td align="center" style="padding:40px 40px 32px;">
              <a href="${resetUrl}" style="display:inline-block;background-color:#f3ff96;color:#1e1e1e;font-size:15px;font-weight:600;text-decoration:none;padding:14px 36px;border-radius:14px;letter-spacing:0.3px;">
                Reset Password
              </a>
            </td>
          </tr>

          <!-- Expiry note -->
          <tr>
            <td align="center" style="padding:0 48px 16px;">
              <p style="margin:0;font-size:12px;color:#b2b2b2;text-align:center;">
                This link will expire in <strong style="color:#f3ff96;">15 minutes</strong>.
              </p>
            </td>
          </tr>

          <!-- Fallback URL -->
          <tr>
            <td align="center" style="padding:0 48px 16px;">
              <p style="margin:0;font-size:11px;color:#b2b2b2;text-align:center;">
                If the button doesn't work, copy and paste this link:
              </p>
              <p style="margin:6px 0 0;font-size:11px;word-break:break-all;text-align:center;">
                <a href="${resetUrl}" style="color:#d4d4d4;text-decoration:none;">${resetUrl}</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:32px 40px 0;">
              <div style="height:1px;background-color:#2e2e2e;"></div>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:20px 40px 36px;">
              <p style="margin:0;font-size:11px;color:#b2b2b2;text-align:center;">
                If you didn't request this, you can safely ignore this email.<br/>
                Your password won't change until you click the link above.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;
