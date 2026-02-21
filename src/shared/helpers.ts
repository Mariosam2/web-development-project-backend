import { Response } from "express";
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
      const { exerciseId: id, ...data } = e;
      return prisma.exercise.upsert({
        where: { id },
        create: data,
        update: {},
      });
    }),
  );

  await prisma.exerciseWorkout.deleteMany({ where: { workoutId } });

  await prisma.exerciseWorkout.createMany({
    data: newExercises.map((e: Exercise, index) => ({
      workoutId,
      exerciseId: e.id,
      exerciseOrder: index + 1,
    })),
  });

  return newExercises;
};
