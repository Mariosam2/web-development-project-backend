import { messageFromPrismaError } from "@src/shared/helpers";
import { ErrorRequestHandler } from "express";
import {
  PrismaClientKnownRequestError,
  PrismaClientValidationError,
} from "../../generated/prisma/internal/prismaNamespace";

export const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
  console.log(err);
  if (err instanceof PrismaClientValidationError) {
    return res.status(400).json({ success: false, message: "Invalid data provided" });
  }

  if (err instanceof PrismaClientKnownRequestError) {
    const model = (err.meta?.modelName as string) ?? "Record";
    return res.status(500).json({ success: false, message: messageFromPrismaError(err.code, model) });
  }

  return res.status(500).json({ success: false, message: "Internal server error" });
};
