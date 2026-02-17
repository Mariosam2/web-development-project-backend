import { IExerciseDetail } from "./IExerciseDetail";
import { IExercise } from "./IExerciseOverview";
import { IExerciseSearch } from "./IExerciseSearch";

export interface IExercisesDbResponse {
  meta: {
    total: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    nextCursor: string;
  };
  data: IExercise[] | IExerciseSearch[] | IExerciseDetail[];
}
