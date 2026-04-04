import { NextFunction, Request, Response } from "express";
import { prisma } from "@src/../lib/prisma";
import { ProfileSettingsSchema } from "@src/shared/schemas/ProfileSchema";
import { IImageOptions } from "@src/shared/interfaces/IImageOptions";
import { handleImage } from "@src/shared/storage";
import { getUserLevel } from "@src/shared/helpers";

export const singleProfile = async (req: Request, res: Response, next: NextFunction) => {
  const { id: userId } = req.user as Express.User;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { firstname: true, lastname: true, username: true, email: true, image: true, imageId: true },
  });

  if (!user) return res.status(404).json({ success: false, message: "User not found" });
  const userLevel = await getUserLevel(userId);
  const { image, ...rest } = user;
  const result = { ...rest, imageUrl: image?.url, level: userLevel };

  return res.status(200).json({ success: true, data: result });
};

export const updateProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id: userId } = req.user as Express.User;
    const raw = {
      firstname: req.body.firstname,
      lastname: req.body.lastname,
      username: req.body.username,
      email: req.body.email,
      imageId: req.body.imageId,
      imageRemoved: req.body.imageRemoved,
    };
    const result = ProfileSettingsSchema.safeParse(raw);
    if (!result.success) {
      return res.status(400).json({
        success: false,
        validationErrors: result.error.issues.map((e) => ({
          field: e.path.join("."),
          message: e.message,
        })),
      });
    }

    const { firstname, lastname, username, email, imageId: userImageId, imageRemoved } = result.data;
    const imageOptions: IImageOptions = {
      req,
      ...(imageRemoved && { imageRemoved }),
      modelId: userId,
      modelName: "user",
    };

    const imageId = await handleImage(userImageId, imageOptions);
    const data = { firstname, lastname, username, email, imageId };
    const newUser = await prisma.user.update({ where: { id: userId }, data });
    return res.status(200).json({ success: true, idOut: newUser.id });
  } catch (error) {
    next(error);
  }
};

export const deleteProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id: userId } = req.user as Express.User;

    await prisma.workout.deleteMany({ where: { userId } });
    await prisma.image.deleteMany({ where: { user: { id: userId } } });
    await prisma.completedWorkout.deleteMany({ where: { userId } });
    await prisma.user.delete({ where: { id: userId } });

    res.clearCookie("refreshToken").status(200).json({ success: true });
  } catch (error) {
    next(error);
  }
};
