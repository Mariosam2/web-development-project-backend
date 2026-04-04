import { prisma } from "@src/../lib/prisma";
import { generateWorkoutFromAgent } from "@src/shared/agent";
import { calculateEstimatedDuration, saveExercisesAndOrderRelations } from "@src/shared/helpers";
import { IImageOptions } from "@src/shared/interfaces/IImageOptions";
import { GenerateWorkoutSchema } from "@src/shared/schemas/GenerateWorkoutSchema";
import { ImportExercisesSchema } from "@src/shared/schemas/ImportExercisesSchema";
import { RemoveExercisesSchema } from "@src/shared/schemas/RemoveExercisesSchema";
import { workoutQuerySchema } from "@src/shared/schemas/WorkoutQuery";
import { WorkoutSchema } from "@src/shared/schemas/WorkoutSchema";
import { createImage, deleteOldImage, handleImage } from "@src/shared/storage";
import { NextFunction, Request, Response } from "express";

export const workouts = async (req: Request, res: Response) => {
  const { id: userId } = req.user as Express.User;
  const queryParams = req.query;

  const validatedParams = workoutQuerySchema.safeParse(queryParams);

  if (!validatedParams.success) {
    return res.status(400).json({
      success: false,
      message: validatedParams.error.issues[0].message,
    });
  }

  const { data: params } = validatedParams;

  const workouts = await prisma.workout.findMany({
    take: params.limit,
    where: {
      userId,
      ...(params.query && { title: { contains: params.query } }),
      ...(params.startDate && { createdAt: { gte: new Date(params.startDate + "T23:59:59.999Z") } }),
      ...(params.endDate && { createdAt: { lte: new Date(params.endDate + "T23:59:59.999Z") } }),
      ...(params.isCompleted !== undefined && { completed: params.isCompleted }),
    },
    omit: { userId: true },
    include: {
      image: { select: { filename: true, url: true } },
      _count: {
        select: { exerciseWorkouts: true },
      },
      exerciseWorkouts: {
        take: 1,
        orderBy: { exerciseOrder: "asc" },
        include: {
          exercise: { select: { imageUrl: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  //console.log(workouts);

  const result = workouts.map(({ image, _count, exerciseWorkouts, ...workout }) => ({
    ...workout,
    imageUrl: image ? image.url : (exerciseWorkouts[0]?.exercise.imageUrl ?? null),
    exerciseCount: _count.exerciseWorkouts,
  }));

  return res.status(200).json({ success: true, data: result });
};
export const singleWorkout = async (req: Request, res: Response) => {
  const { id: userId } = req.user as Express.User;
  const { workoutId } = req.params;

  const workout = await prisma.workout.findFirst({
    where: { userId, id: workoutId as string },
    omit: { userId: true },
    include: {
      image: { select: { filename: true, url: true } },
      _count: {
        select: { exerciseWorkouts: true },
      },
      exerciseWorkouts: {
        take: 1,
        orderBy: { exerciseOrder: "asc" },
        include: {
          exercise: { select: { imageUrl: true } },
        },
      },
    },
  });

  if (!workout) return res.status(404).json({ success: false, message: "Workout not found" });

  const { image, _count, exerciseWorkouts, ...rest } = workout;
  const result = {
    ...rest,
    imageUrl: image ? image.url : (exerciseWorkouts[0]?.exercise.imageUrl ?? null),
    exerciseCount: _count.exerciseWorkouts,
  };

  return res.status(200).json({ success: true, data: result });
};

export const exercises = async (req: Request, res: Response) => {
  const { workoutId } = req.params;
  const exerciseWorkouts = await prisma.exerciseWorkout.findMany({
    where: { workoutId: workoutId as string },
    include: { exercise: true },
    orderBy: { exerciseOrder: "asc" },
  });

  const exercises = exerciseWorkouts.map(({ exercise, sets, reps }) => ({
    ...exercise,
    sets,
    reps,
  }));

  return res.status(200).json({ success: true, data: exercises });
};

export const addWorkout = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const raw = {
      title: req.body.title,
      exercises: JSON.parse(req.body.exercises),
    };

    const result = WorkoutSchema.safeParse(raw);
    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.error.issues[0].message,
      });
    }

    let imageId: string | null = null;
    if (req.file) {
      imageId = await createImage(req.file);
    }

    const { id: userId } = req.user as Express.User;
    const { exercises, ...workout } = result.data;

    const newWorkout = await prisma.workout.create({
      data: {
        ...workout,
        userId,
        estimatedDuration: calculateEstimatedDuration(exercises),
        imageId,
      },
    });
    await saveExercisesAndOrderRelations(exercises, newWorkout.id);

    return res.status(200).json({ success: true, idOut: newWorkout.id, message: "Workout created successfully!" });
  } catch (error) {
    next(error);
  }
};

export const updateWorkout = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { workoutId } = req.params;
    const raw = {
      title: req.body.title,
      exercises: JSON.parse(req.body.exercises),
      imageId: req.body.imageId,
      imageRemoved: req.body.imageRemoved,
    };

    const result = WorkoutSchema.safeParse(raw);
    if (!result.success || !workoutId) {
      return res.status(400).json({
        success: false,
        message: result.error?.issues[0].message ?? "WorkoutId is required",
      });
    }
    const { exercises, imageRemoved, ...workout } = result.data;

    const imageOptions: IImageOptions = {
      req,
      ...(imageRemoved && { imageRemoved }),
      modelId: workoutId as string,
      modelName: "workout",
    };

    const imageId = await handleImage(workout.imageId, imageOptions);
    const newWorkout = await prisma.workout.update({
      where: { id: workoutId as string },
      data: { ...workout, estimatedDuration: calculateEstimatedDuration(exercises), imageId },
    });
    await saveExercisesAndOrderRelations(exercises, newWorkout.id);

    return res.status(200).json({ success: true, idOut: newWorkout.id, message: "Workout updated successfully!" });
  } catch (error) {
    console.log(error);
    next(error);
  }
};

export const deleteWorkout = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { workoutId } = req.params;
    if (!workoutId) {
      return res.status(400).json({ success: false, message: "WorkoutId is required" });
    }
    await deleteOldImage(workoutId as string, "workout");
    await prisma.completedWorkout.deleteMany({ where: { workoutId: workoutId as string } });
    await prisma.image.deleteMany({ where: { workout: { id: workoutId as string } } });
    await prisma.exerciseWorkout.deleteMany({ where: { workoutId: workoutId as string } });

    const deletedWorkout = await prisma.workout.delete({ where: { id: workoutId as string } });
    if (!deletedWorkout) {
      return res.status(404).json({ success: false, message: "Workout not found" });
    }

    return res.status(200).json({ success: true, idOut: deletedWorkout.id, message: "Workout updated successfully!" });
  } catch (error) {
    next(error);
  }
};

export const importExercises = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = ImportExercisesSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.error.issues[0].message,
      });
    }

    const { workoutId, exercises } = result.data;
    const newExercises = await saveExercisesAndOrderRelations(exercises, workoutId);
    await prisma.workout.update({
      where: { id: workoutId },
      data: { estimatedDuration: calculateEstimatedDuration(exercises) },
    });

    return res
      .status(200)
      .json({ success: true, idOut: newExercises.map((e) => e.id), message: "exercises imported successfully!" });
  } catch (error) {
    next(error);
  }
};

export const removeExercises = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = RemoveExercisesSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.error.issues[0].message,
      });
    }

    const { exercisesIds, workoutId } = result.data;
    const totalExercises = await prisma.exerciseWorkout.count({
      where: { workoutId },
    });

    if (exercisesIds.length >= totalExercises) {
      return res.status(400).json({ success: false, message: "A workout must have at least one exercise" });
    }

    await prisma.exerciseWorkout.deleteMany({
      where: {
        workoutId,
        exerciseId: { in: exercisesIds },
      },
    });

    const remainingExercises = await prisma.exerciseWorkout.findMany({
      where: { workoutId },
      include: { exercise: true },
    });

    const exercisesRepsAndSets = remainingExercises.map((e) => ({
      reps: e.reps,
      sets: e.sets,
    }));

    await prisma.workout.update({
      where: { id: workoutId as string },
      data: { estimatedDuration: calculateEstimatedDuration(exercisesRepsAndSets) },
    });

    return res.status(200).json({ success: true, idOut: exercisesIds, message: "exercises imported successfully!" });
  } catch (error) {
    next(error);
  }
};

export const completeWorkout = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id: userId } = req.user as Express.User;
    const { workoutId } = req.params;
    const { completedAt: completedAtRaw } = req.body;
    const completedAt = completedAtRaw ? new Date(completedAtRaw) : new Date();

    await prisma.workout.update({
      where: { id: workoutId as string },
      data: { completed: true, completedAt },
    });
    await prisma.completedWorkout.create({ data: { workoutId: workoutId as string, userId, completedAt } });

    return res.status(200).json({ success: true, idOut: workoutId, message: "Workout completed successfully!" });
  } catch (error) {
    console.log(error);
    next(error);
  }
};

export const generateWorkout = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id: userId } = req.user as Express.User;

    const result = GenerateWorkoutSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.error.issues[0].message,
      });
    }

    const workoutInput = result.data;
    //console.log(workoutInput);

    const workout = await generateWorkoutFromAgent(workoutInput);

    //console.log(workout);

    const { exercises, ...rest } = workout;

    const newWorkout = await prisma.workout.create({
      data: { ...rest, userId },
    });

    await saveExercisesAndOrderRelations(exercises, newWorkout.id);

    return res.status(200).json({ success: true, idOut: newWorkout.id, message: "Workout generated successfully!" });
  } catch (error) {
    next(error);
  }
};
