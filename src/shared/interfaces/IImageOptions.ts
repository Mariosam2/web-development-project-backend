import { Request } from "express";
import { ModelsWithImage } from "../storage";

export interface IImageOptions {
  req: Request;
  imageRemoved?: boolean;
  modelId?: string;
  modelName: ModelsWithImage;
}
