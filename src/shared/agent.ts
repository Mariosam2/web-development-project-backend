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
const MUSCLE_MAPPING = `ADDUCTOR LONGUS: Adductor Longus,
    ADDUCTOR BREVIS: Adductor Brevis,
    ADDUCTOR MAGNUS: Adductor Magnus,
    BICEPS BRACHII: Biceps,
    BRACHIALIS: Brachialis,
    BRACHIORADIALIS: Brachioradialis,
    DEEP HIP EXTERNAL ROTATORS: Hip External Rotators,
    ANTERIOR DELTOID: Front Delts,
    LATERAL DELTOID: Side Delts,
    POSTERIOR DELTOID: Rear Delts,
    ERECTOR SPINAE: Lower Back,
    GASTROCNEMIUS: Calves,
    GLUTEUS MAXIMUS: Glutes,
    GLUTEUS MEDIUS: Glute Med,
    GLUTEUS MINIMUS: Glute Min,
    GRACILIS: Gracilis,
    HAMSTRINGS: Hamstrings,
    ILIOPSOAS: Hip Flexors,
    INFRASPINATUS: Infraspinatus,
    LATISSIMUS DORSI: Lats,
    LEVATOR SCAPULAE: Levator Scapulae,
    OBLIQUES: Obliques,
    PECTINEUS: Pectineus,
    PECTORALIS MAJOR CLAVICULAR HEAD: Upper Chest,
    PECTORALIS MAJOR STERNAL HEAD: Lower Chest,
    POPLITEUS: Popliteus,
    QUADRICEPS: Quads,
    RECTUS ABDOMINIS: Abs,
    SARTORIUS: Sartorius,
    SERRATUS ANTE: Serratus,
    SERRATUS ANTERIOR: Serratus Anterior,
    SOLEUS: Soleus,
    SPLENIUS: Splenius,
    STERNOCLEIDOMASTOID: Neck (SCM),
    SUBSCAPULARIS: Subscapularis,
    TENSOR FASCIAE LATAE: TFL,
    TERES MAJOR: Teres Major,
    TERES MINOR: Teres Minor,
    TIBIALIS ANTERIOR: Tibialis,
    TRANSVERSUS ABDOMINIS: Deep Core,
    TRAPEZIUS LOWER FIBERS: Lower Traps,
    TRAPEZIUS MIDDLE FIBERS: Mid Traps,
    TRAPEZIUS UPPER FIBERS: Upper Traps,
    TRICEPS BRACHII: Triceps,
    WRIST EXTENSORS: Wrist Extensors,
    WRIST FLEXORS: Wrist Flexors`;

export const generateEmbedding = async (workoutInput: z.infer<typeof GenerateWorkoutSchema>) => {
  const queryText = [
    `Goal: ${workoutInput.goal}`,
    workoutInput.targetMuscles ? `Target Muscles: ${workoutInput.targetMuscles.join(", ")}` : "",
    workoutInput.equipments ? `Equipments: ${workoutInput.equipments.join(", ")}` : "",
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
  //console.log("EQUIPMENTS", workoutInput.equipments);
  const { data, error } = await supabase.rpc("match_exercises", {
    query_embedding: embedding,
    match_count: 15,
  });

  if (error) throw error;

  return data as IExerciseMatch[];
};

export const generateWorkoutFromAgent = async (workoutInput: z.infer<typeof GenerateWorkoutSchema>) => {
  const exercises = await getRelevantExercises(workoutInput);
  const { output } = await generateText({
    model: anthropic("claude-sonnet-4-5-20250929"),
    output: Output.object({
      schema: AIWorkoutSchema,
    }),
    prompt: `
    Generate a workout based on the following input:
    Goal: ${workoutInput.goal}
    User Level: ${workoutInput.level}
    ${workoutInput.targetMuscles ? `Target Muscles: ${workoutInput.targetMuscles.join(", ")}` : ""}
    ${workoutInput.equipments ? `Equipments: ${workoutInput.equipments.join(", ")}` : ""}
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
    targetMuscles: ${e.target_muscles.join(", ")}
    `,
     )
     .join("\n")}

    For each exercise you select, also decide appropriate reps and sets based on the user's goal.
    Write a workout description with a maximum of 600 characters that explains the overall strategy, why these exercises were chosen together, and how they align with the user's goal.
    I'm sending you also a mapping between the target muscles names and target muscles display names, please refer to the display names on the right when creating
    the workout description.
    ${MUSCLE_MAPPING}
    
  `,
  });

  const workoutWithImages = {
    ...output,
    exercises: output.exercises.map((ex) => {
      const match = exercises.find((e) => e.exercise_id === ex.exerciseId);
      return {
        ...ex,
        imageUrl: match?.image_url ?? undefined,
      };
    }),
  };

  //console.log("EXERCISES", exercises, "EXERCISES WITH IMAGES", workoutWithImages.exercises);

  return workoutWithImages;
};
