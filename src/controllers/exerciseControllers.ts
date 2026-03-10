import "dotenv/config";
import { createQueryParams, fetchTyped, getEnvOrThrow } from "@src/shared/helpers";
import { IExerciseOverview } from "@src/shared/interfaces/ExerciseDb/IExerciseOverview";
import { Request, Response } from "express";
import { IBodyPart } from "@src/shared/interfaces/ExerciseDb/IBodyPart";
import { IExerciseType } from "@src/shared/interfaces/ExerciseDb/IExerciseType";
import { ITargetMuscle } from "@src/shared/interfaces/ExerciseDb/ITargetMuscle";
import { IExerciseDetail } from "@src/shared/interfaces/ExerciseDb/IExerciseDetail";
import { IEquipment } from "@src/shared/interfaces/ExerciseDb/IEquipment";

export const exercises = async (req: Request, res: Response) => {
  try {
    const queryParams = createQueryParams(req);
    const result = await fetchTyped<IExerciseOverview[]>(
      `${getEnvOrThrow("EXERCISEDB_API_BASE_URL")}/exercises?${queryParams.toString()}`,
    );

    if (typeof result === "string") {
      return res.status(500).json({ success: false, message: result });
    }

    const { meta, data: exercises } = result;

    return res.status(200).json({ success: true, meta, data: exercises });
  } catch (error) {
    return res.status(500).json({ success: false, message: (error as Error).message });
  }
};

export const singleExercise = async (req: Request, res: Response) => {
  try {
    const { exerciseId } = req.params;
    const result = await fetchTyped<IExerciseDetail>(
      getEnvOrThrow("EXERCISEDB_API_BASE_URL") + `/exercises/${exerciseId}`,
    );

    if (typeof result === "string") {
      return res.status(500).json({ success: false, message: result });
    }

    const { data: exercise } = result;

    return res.status(200).json({ success: true, data: exercise });
  } catch (error) {
    return res.status(500).json({ success: false, message: (error as Error).message });
  }
};

export const bodyParts = async (req: Request, res: Response) => {
  try {
    const result = await fetchTyped<IBodyPart[]>(getEnvOrThrow("EXERCISEDB_API_BASE_URL") + `/bodyparts`);

    if (typeof result === "string") {
      return res.status(500).json({ success: false, message: result });
    }

    const { data: bodyParts } = result;

    return res.status(200).json({ success: true, data: bodyParts });
  } catch (error) {
    return res.status(500).json({ success: false, message: (error as Error).message });
  }
};
export const targetMuscles = async (req: Request, res: Response) => {
  try {
    const result = await fetchTyped<ITargetMuscle[]>(getEnvOrThrow("EXERCISEDB_API_BASE_URL") + `/muscles`);
    if (typeof result === "string") {
      return res.status(500).json({ success: false, message: result });
    }

    const { data: targetMuscles } = result;
    return res.status(200).json({ success: true, data: targetMuscles });
  } catch (error) {
    return res.status(500).json({ success: false, message: (error as Error).message });
  }
};

export const exerciseTypes = async (req: Request, res: Response) => {
  try {
    const result = await fetchTyped<IExerciseType[]>(getEnvOrThrow("EXERCISEDB_API_BASE_URL") + `/exercisetypes`);

    if (typeof result === "string") {
      return res.status(500).json({ success: false, message: result });
    }
    const { data: types } = result;

    return res.status(200).json({ success: true, data: types });
  } catch (error) {
    return res.status(500).json({ success: false, message: (error as Error).message });
  }
};

export const equipments = async (req: Request, res: Response) => {
  try {
    const result = await fetchTyped<IEquipment[]>(getEnvOrThrow("EXERCISEDB_API_BASE_URL") + `/equipments`);

    if (typeof result === "string") {
      return res.status(500).json({ success: false, message: result });
    }
    const { data: equipments } = result;

    return res.status(200).json({ success: true, data: equipments });
  } catch (error) {
    return res.status(500).json({ success: false, message: (error as Error).message });
  }
};
