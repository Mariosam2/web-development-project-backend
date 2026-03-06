import { prisma } from "@src/../lib/prisma";
import { saveExercisesAndOrderRelations } from "@src/shared/helpers";
import { ImportExercisesSchema } from "@src/shared/schemas/ImportExercisesSchema";
import { RemoveExercisesSchema } from "@src/shared/schemas/RemoveExercisesSchema";
import { workoutQuerySchema } from "@src/shared/schemas/WorkoutQuery";
import { WorkoutSchema } from "@src/shared/schemas/WorkoutSchema";
import { createImage, deleteOldImage } from "@src/shared/storage";
import { NextFunction, Request, Response } from "express";

export const workouts = async (req: Request, res: Response) => {
  const { userId } = req.user as Express.User;
  const queryParams = req.query;

  const validatedParams = workoutQuerySchema.safeParse(queryParams);
  //console.log(validatedParams);
  if (!validatedParams.success) {
    return res.status(400).json({
      success: false,
      validationErrors: validatedParams.error.issues.map((e) => ({
        field: e.path.join("."),
        message: e.message,
      })),
    });
  }

  const { data: params } = validatedParams;

  const workouts = await prisma.workout.findMany({
    take: params.limit,
    where: {
      userId,
      ...(params.query && { title: { contains: params.query } }),
      ...(params.startDate && { createdAt: { gte: params.startDate } }),
      ...(params.endDate && { createdAt: { lte: params.endDate } }),
      ...(params.isCompleted !== undefined && { completed: params.isCompleted }),
    },
    omit: { userId: true },
    include: {
      image: { select: { filename: true } },
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

  const result = workouts.map(({ image, _count, exerciseWorkouts, ...workout }) => ({
    ...workout,
    imageUrl: image ? `/uploads/${image.filename}` : (exerciseWorkouts[0]?.exercise.imageUrl ?? null),
    exerciseCount: _count.exerciseWorkouts,
  }));

  return res.status(200).json({ success: true, data: result });
};
export const singleWorkout = async (req: Request, res: Response) => {
  const { userId } = req.user as Express.User;
  const { workoutId } = req.params;

  const workout = await prisma.workout.findFirst({
    where: { userId, id: workoutId as string },
    omit: { userId: true },
    include: {
      image: { select: { filename: true } },
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
    imageUrl: image ? `/uploads/${image.filename}` : (exerciseWorkouts[0]?.exercise.imageUrl ?? null),
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
      estimatedDuration: Number(req.body.estimatedDuration),
      exercises: JSON.parse(req.body.exercises),
    };

    const result = WorkoutSchema.safeParse(raw);
    if (!result.success) {
      return res.status(400).json({
        success: false,
        validationErrors: result.error.issues.map((e) => ({
          field: e.path.join("."),
          message: e.message,
        })),
      });
    }
    const imageId = await createImage(req.file);
    const { userId } = req.user as Express.User;
    const { exercises, ...workout } = result.data;

    const newWorkout = await prisma.workout.create({
      data: {
        ...workout,
        userId,
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
      estimatedDuration: Number(req.body.estimatedDuration),
      exercises: JSON.parse(req.body.exercises),
      imageRemoved: req.body.imageRemoved,
    };

    const result = WorkoutSchema.safeParse(raw);
    if (!result.success || !workoutId) {
      return res.status(400).json({
        success: false,
        validationErrors:
          result.error?.issues.map((e) => ({
            field: e.path.join("."),
            message: e.message,
          })) ?? "WorkoutId is required",
      });
    }
    const { exercises, imageRemoved, ...workout } = result.data;

    let imageId = workout.imageId;
    console.log(req.file, imageRemoved);

    if (req.file) {
      await deleteOldImage(workoutId as string);
      imageId = await createImage(req.file);
    } else if (imageRemoved) {
      await deleteOldImage(workoutId as string);
      imageId = undefined;
    }

    const newWorkout = await prisma.workout.update({
      where: { id: workoutId as string },
      data: { ...workout, imageId },
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
    await deleteOldImage(workoutId as string);
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
        validationErrors: result.error.issues.map((e) => ({
          field: e.path.join("."),
          message: e.message,
        })),
      });
    }

    const { workoutId, exercises } = result.data;
    const newExercises = await saveExercisesAndOrderRelations(exercises, workoutId);

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
        validationErrors: result.error.issues.map((e) => ({
          field: e.path.join("."),
          message: e.message,
        })),
      });
    }

    const { exercisesIds, workoutId, updatedDuration } = result.data;
    const totalExercises = await prisma.exerciseWorkout.count({
      where: { workoutId },
    });

    if (exercisesIds.length >= totalExercises) {
      return res.status(400).json({ success: false, message: "A workout must have at least one exercise" });
    }

    await prisma.workout.update({
      where: { id: workoutId as string },
      data: { estimatedDuration: updatedDuration },
    });
    await prisma.exerciseWorkout.deleteMany({
      where: {
        workoutId,
        exerciseId: { in: exercisesIds },
      },
    });

    return res.status(200).json({ success: true, idOut: exercisesIds, message: "exercises imported successfully!" });
  } catch (error) {
    next(error);
  }
};

export const completeWorkout = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.user as Express.User;
    const { workoutId } = req.params;

    const completedAt = new Date();

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
