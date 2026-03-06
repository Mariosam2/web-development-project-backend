import multer from "multer";
import type { Request, Response, NextFunction } from "express";
import { prisma } from "@src/../lib/prisma";
import { getEnvOrThrow } from "./helpers";
import fs from "fs";
import fsp from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

const UPLOAD__DIR = getEnvOrThrow("UPLOADS_DIR");

if (!fs.existsSync(UPLOAD__DIR)) {
  fs.mkdirSync(UPLOAD__DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD__DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    console.log(file);
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
      console.log(file);
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

export const deleteOldImage = async (oldImageId: string) => {
  const oldWorkout = await prisma.workout.findUnique({
    where: { id: oldImageId },
    include: { image: true },
  });

  if (oldWorkout?.image) {
    await fsp.unlink(path.join(getEnvOrThrow("UPLOADS_DIR"), oldWorkout.image.filename)).catch(() => {});
    await prisma.image.delete({ where: { id: oldWorkout.image.id } });
  }
};
