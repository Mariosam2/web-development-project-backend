export interface IExerciseDetail {
  exerciseId: string;
  name: string;
  imageUrl: string;
  imageUrls: {
    "360p": string;
    "480p": string;
    "720p": string;
    "1080p": string;
  };
  equipments: string[];
  bodyParts: string[];
  exerciseType: string;
  targetMuscles: string[];
  secondaryMuscles: string[];
  videoUrl: string;
  keywords: string[];
  overview: string;
  instructions: string[];
  exerciseTips: string[];
  variations: string[];
  relatedExerciseIds: string[];
}
