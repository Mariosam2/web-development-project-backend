import * as z from "zod";
import { GenerateWorkoutSchema } from "./schemas/GenerateWorkoutSchema";
import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";
import { IExerciseMatch } from "./interfaces/IExerciseMatch";
import { createAnthropic } from "@ai-sdk/anthropic";
import { generateText, Output } from "ai";
import { AIWorkoutSchema } from "./schemas/AIWorkoutSchema";
import { getEnvOrThrow } from "./helpers";

const openai = new OpenAI({ apiKey: getEnvOrThrow("OPENAI_API_KEY") });
const anthropic = createAnthropic({ apiKey: getEnvOrThrow("ANTHROPIC_API_KEY") });
const supabase = createClient(getEnvOrThrow("SUPABASE_URL"), getEnvOrThrow("SUPABASE_SERVICE_KEY"));
export const generateEmbedding = async (workoutInput: z.infer<typeof GenerateWorkoutSchema>) => {
  const queryText = [
    `Goal: ${workoutInput.goal}`,
    `Target Muscles: ${workoutInput.targetMuscles.join(", ")}`,
    `Equipments: ${workoutInput.equipments.join(", ")}`,
    `Notes: ${workoutInput.notes}`,
  ].filter(Boolean);
  const response = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: queryText.join("\n"),
    dimensions: 1536,
  });
  return response.data[0].embedding;
};

export const getRelevantExercises = async (workoutInput: z.infer<typeof GenerateWorkoutSchema>) => {
  const embedding = await generateEmbedding(workoutInput);

  const { data, error } = await supabase.rpc("match_exercises", {
    query_embedding: embedding,
    match_count: 20,
    filter_equipment: workoutInput.equipments.length > 0 ? workoutInput.equipments : null,
  });

  if (error) throw error;

  return data as IExerciseMatch[];
};

export const generateWorkoutFromAgent = async (workoutInput: z.infer<typeof GenerateWorkoutSchema>) => {
  const exercises = await getRelevantExercises(workoutInput);
  const { output } = await generateText({
    model: anthropic("claude-sonnet-4.5"),
    output: Output.object({
      schema: AIWorkoutSchema,
    }),
    prompt: `
    Generate a workout based on the following input:
    Goal: ${workoutInput.goal}
    Target Muscles: ${workoutInput.targetMuscles.join(", ")}
    Notes: ${workoutInput.notes}

    Rules:
    - Choose 4-8 exercises from the list below
    - For strength goals: 3-5 sets, 3-6 reps
    - For hypertrophy goals: 3-4 sets, 8-12 reps
    - For endurance goals: 2-3 sets, 15-20 reps
    - Assign reps and sets based on the goal

    Choose from these exercises only:
   ${exercises
     .map(
       (e) => `
    exerciseId: ${e.exercise_id}
    name: ${e.name}
    imageUrl: ${e.image_url}
    bodyParts: ${e.body_parts.join(", ")}
    equipments: ${e.equipments.join(", ")}
    exerciseType: ${e.exercise_type}
    targetMuscles: ${e.target_muscles.join(", ")}
    secondaryMuscles: ${e.secondary_muscles.join(", ")}
    `,
     )
     .join("\n")}

    For each exercise you select, also decide appropriate reps and sets based on the user's goal.
  `,
  });

  return output;
};
