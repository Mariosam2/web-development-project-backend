import "dotenv/config";
import { fetchTyped, getEnvOrThrow } from "@src/shared/helpers";
import { IExerciseOverview } from "@src/shared/interfaces/Exercise/IExerciseOverview";
import { Request, Response } from "express";
import { IExerciseSearch } from "@src/shared/interfaces/Exercise/IExerciseSearch";

export const exercises = async (req: Request, res: Response) => {
  try {
    const { query } = req.query;

    const exercises = await fetchTyped<IExerciseOverview[]>(
      getEnvOrThrow("EXERCISEDB_API_BASE_URL") + `/exercises?name${query}`,
    );
    return res.status(200).json({ success: true, data: exercises });
  } catch (error) {
    return res.status(500).json({ succes: false, message: (error as Error).message });
  }
};

export const exercise = async (req: Request, res: Response) => {
  try {
    const { exerciseId } = req.params;
    const exercise = await fetchTyped<IExerciseOverview>(
      getEnvOrThrow("EXERCISEDB_API_BASE_URL") + `/exercises/${exerciseId}`,
    );
    return res.status(200).json({ success: true, data: exercise });
  } catch (error) {
    return res.status(500).json({ succes: false, message: (error as Error).message });
  }
};
