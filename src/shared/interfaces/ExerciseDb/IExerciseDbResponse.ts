import { IExerciseDetail } from "./IExerciseDetail";
import { IExerciseOverview } from "./IExerciseOverview";
import { IExerciseSearch } from "./IExerciseSearch";

export interface IExercisesDbResponse {
  meta: {
    total: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    nextCursor: string;
  };
  data: IExerciseOverview[] | IExerciseSearch[] | IExerciseDetail[];
}
