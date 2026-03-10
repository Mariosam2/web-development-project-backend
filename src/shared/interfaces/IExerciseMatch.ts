export interface IExerciseMatch {
  exercise_id: string;
  name: string;
  image_url: string | null;
  body_parts: string[];
  equipments: string[];
  exercise_type: string | null;
  target_muscles: string[];
  secondary_muscles: string[];
  content: string;
  similarity: number;
}
