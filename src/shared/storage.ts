import multer from "multer";
import type { Request, Response, NextFunction } from "express";
import { prisma } from "@src/../lib/prisma";
import { getEnvOrThrow } from "./helpers";
import fs from "fs";
import fsp from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { IImageOptions } from "./interfaces/IImageOptions";

const getUploadDir = () => getEnvOrThrow("UPLOADS_DIR");

if (!fs.existsSync(getUploadDir())) {
  fs.mkdirSync(getUploadDir(), { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, getUploadDir()),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${randomUUID()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only JPEG, PNG and WebP are allowed"));
    }
  },
});

export const handleUpload = (field: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    upload.single(field)(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        console.log(err);
        return res.status(400).json({ error: err.message });
      }
      if (err) {
        console.log(err);
        return res.status(400).json({ error: err.message });
      }
      next();
    });
  };
};

export const createImage = async (file?: Express.Multer.File) => {
  let imageId: string | undefined;
  if (file) {
    const newImage = {
      filename: file.filename,
    };
    const workoutImage = await prisma.image.create({
      data: newImage,
    });
    imageId = workoutImage.id;
  }
  return imageId;
};

export type ModelsWithImage = "workout" | "user";
export const deleteOldImage = async (modelId: string, modelName: ModelsWithImage) => {
  let imageId: string | null = null;
  let imageFilename: string | null = null;

  switch (modelName) {
    case "workout": {
      const record = await prisma.workout.findUnique({
        where: { id: modelId },
        include: { image: true },
      });
      imageId = record?.image?.id ?? null;
      imageFilename = record?.image?.filename ?? null;
      break;
    }
    case "user": {
      const record = await prisma.user.findUnique({
        where: { id: modelId },
        include: { image: true },
      });
      imageId = record?.image?.id ?? null;
      imageFilename = record?.image?.filename ?? null;
      break;
    }
  }

  if (imageFilename) {
    await fsp.unlink(path.join(getUploadDir(), imageFilename)).catch(() => {});
  }
  if (imageId) {
    await prisma.image.delete({ where: { id: imageId } });
  }
};

export const handleImage = async (imageId: string | undefined, imageOptions: IImageOptions) => {
  const { req, imageRemoved, modelId, modelName } = imageOptions;
  if (req.file) {
    await deleteOldImage(modelId as string, modelName);
    imageId = await createImage(req.file);
  } else if (imageRemoved) {
    await deleteOldImage(modelId as string, modelName);
    imageId = undefined;
  }

  return imageId;
};
